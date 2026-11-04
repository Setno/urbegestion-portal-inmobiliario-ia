import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { Reports } from './Reports';
import { useTimelineStore } from '../stores/useTimelineStore';
import { setLeadEventRepository } from '../services/leadEventRepository';
import type { Lead } from '../types/lead';

const hoy = new Date().toISOString().slice(0, 10);
const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Sin Nombre', email: '', phone: '', operationInterest: 'compra', status: 'nuevo',
  notes: [], source: 'formulario_contacto', createdAt: hoy, ...over,
});

describe('Reportes del CRM (H-060)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {} });
  });
  afterEach(cleanup);

  const leads = [
    lead({ id: 'a', status: 'cerrado', source: 'ficha_propiedad', attribution: { fuente: 'google', campana: 'verano' } }),
    lead({ id: 'b', status: 'contactado', source: 'ficha_propiedad' }),
    lead({ id: 'c', status: 'nuevo', source: 'asistente_ia' }),
    lead({ id: 'd', status: 'descartado' }),
    lead({ id: 'viejo', createdAt: '2020-01-01', status: 'cerrado' }),
  ];

  it('muestra el embudo con la conversión entre etapas y los descartados', () => {
    render(<Reports leads={leads} />);
    const embudo = screen.getByRole('region', { name: 'Embudo por etapa' });
    const filas = within(embudo).getAllByRole('row').map((r) => r.textContent ?? '');
    expect(filas.find((f) => f.startsWith('Contactado'))).toContain('67 %');
    expect(within(embudo).getByText(/Descartados: 1/)).toBeTruthy();
  });

  it('por defecto mira los últimos 30 días y "Todo el tiempo" incluye los antiguos', () => {
    render(<Reports leads={leads} />);
    expect(screen.getByText('Reportes · 4 leads')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Período del reporte'), { target: { value: 'todo' } });
    expect(screen.getByText('Reportes · 5 leads')).toBeTruthy();
  });

  it('agrupa por origen y por campaña', () => {
    render(<Reports leads={leads} />);
    const origen = screen.getByRole('region', { name: 'Por origen del contacto' });
    expect(within(origen).getByText('Ficha de propiedad')).toBeTruthy();
    const campana = screen.getByRole('region', { name: 'Por campaña' });
    expect(within(campana).getByText('google / verano')).toBeTruthy();
    expect(within(campana).getByText('Directo')).toBeTruthy();
  });

  it('sin historial de contactos dice "sin datos todavía" en vez de inventar un promedio', () => {
    render(<Reports leads={leads} />);
    const tiempos = screen.getByRole('region', { name: 'Tiempos de respuesta' });
    expect(within(tiempos).getByText('sin datos todavía')).toBeTruthy();
  });

  it('con leads nuevos sin contactar hace más de un día, los cuenta', () => {
    const hace2dias = new Date(Date.now() - 48 * 3600_000).toISOString();
    render(<Reports leads={[lead({ id: 'z', createdAt: hace2dias.slice(0, 10), createdAtIso: hace2dias })]} />);
    const tiempos = screen.getByRole('region', { name: 'Tiempos de respuesta' });
    expect(within(tiempos).getByText('1')).toBeTruthy();
  });
});

describe('Reportes: avisos de datos incompletos (H-060)', () => {
  beforeEach(() => useTimelineStore.setState({ events: {}, allStatus: 'idle' }));
  afterEach(cleanup);

  it('avisa cuando el historial no se pudo cargar, en vez de mostrar solo ceros', async () => {
    setLeadEventRepository({ mode: 'remote', newId: () => 'n', listForLead: async () => [], listAll: async () => { throw new Error('sin red'); }, create: async () => {} });
    render(<Reports leads={[lead({ id: 'a' })]} />);
    expect(await screen.findByText(/No se pudo cargar el historial de contactos/)).toBeTruthy();
    setLeadEventRepository(null);
  });

  it('avisa cuántos leads no tienen hora exacta y no se midieron', () => {
    render(<Reports leads={[lead({ id: 'a' }), lead({ id: 'b' })]} />);
    expect(screen.getByText('2 leads sin hora exacta de registro no se midieron.')).toBeTruthy();
  });
});
