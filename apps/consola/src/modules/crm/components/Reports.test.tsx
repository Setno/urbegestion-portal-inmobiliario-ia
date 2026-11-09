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

describe('Dashboard de gestión (H-061)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {} });
  });
  afterEach(cleanup);

  const tarjeta = (nombre: string) => screen.getByRole('group', { name: nombre });

  it('arriba muestra las tarjetas con los números clave del período', () => {
    render(<Reports leads={[
      lead({ id: 'a', status: 'cerrado' }), lead({ id: 'b', status: 'visita_agendada' }),
      lead({ id: 'c', status: 'nuevo' }), lead({ id: 'd', status: 'descartado' }),
    ]} />);
    const clave = screen.getByRole('region', { name: 'Números clave' });
    expect(within(clave).getAllByRole('group')).toHaveLength(6);
    expect(within(tarjeta('Leads nuevos')).getByText('4')).toBeTruthy();
    expect(within(tarjeta('De lead a visita')).getByText('67 %')).toBeTruthy(); // 2 de 3 activos
  });

  it('compara con el período anterior y, sin base, lo dice en vez de inventar un porcentaje', () => {
    const antes = new Date(Date.now() - 40 * 86_400_000).toISOString().slice(0, 10);
    const { rerender } = render(<Reports leads={[lead({ id: 'a' })]} />);
    expect(within(tarjeta('Leads nuevos')).getByText(/sin período anterior para comparar/i)).toBeTruthy();
    rerender(<Reports leads={[lead({ id: 'a' }), lead({ id: 'b' }), lead({ id: 'p', createdAt: antes })]} />);
    expect(within(tarjeta('Leads nuevos')).getByText(/100 % más que el período anterior/)).toBeTruthy();
  });

  it('un indicador sin datos explica por qué en vez de mostrar cero', () => {
    render(<Reports leads={[lead({ id: 'a' })]} />);
    const t = tarjeta('Primer contacto');
    expect(within(t).getByText('sin datos')).toBeTruthy();
    expect(within(t).getByText(/ningún contacto registrado/i)).toBeTruthy();
    cleanup();
    render(<Reports leads={[]} />);
    expect(within(tarjeta('De lead a visita')).getByText(/no hay contactos en el período/i)).toBeTruthy();
  });

  it('el seguimiento cuenta acciones vencidas y contactos sin próxima acción', () => {
    render(<Reports leads={[
      lead({ id: 'a', nextActionText: 'llamar', nextActionDue: '2020-01-01' }),
      lead({ id: 'b' }),
    ]} />);
    const t = tarjeta('Seguimiento');
    expect(within(t).getByText('1 vencida')).toBeTruthy();
    expect(within(t).getByText(/1 sin próxima acción/)).toBeTruthy();
  });

  it('muestra los leads por semana con barras', () => {
    render(<Reports leads={[lead({ id: 'a' }), lead({ id: 'b', source: 'asistente_ia' })]} />);
    const sem = screen.getByRole('region', { name: 'Leads por semana' });
    const barras = within(sem).getAllByRole('img');
    expect(barras.length).toBeGreaterThanOrEqual(4);
    expect(barras[barras.length - 1].getAttribute('aria-label')).toMatch(/2 leads/);
  });
});
