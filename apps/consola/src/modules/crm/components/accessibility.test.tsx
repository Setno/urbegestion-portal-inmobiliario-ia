import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { accessibilityViolations } from '../../../test/a11y';
import { Reports } from './Reports';
import { Agenda } from './Agenda';
import { Timeline } from './Timeline';
import { NextActionEditor, TodayPanel } from './NextAction';
import { LeadsTab } from './LeadsTab';
import { useLeadStore } from '../stores/useLeadStore';
import { useTimelineStore } from '../stores/useTimelineStore';
import { localToday } from '../services/leadTasks';
import type { Lead } from '../types/lead';

// Línea base de accesibilidad del CRM (H-024): ninguna infracción seria o crítica según axe-core.
const hoy = localToday();
const lead = (over: Partial<Lead>): Lead => ({
  id: 'a', fullName: 'Ana Rojas', email: 'ana@e.cl', phone: '+56 9 1111 2222', operationInterest: 'compra', status: 'visita_agendada',
  notes: ['Nota'], source: 'ficha_propiedad', createdAt: hoy, createdAtIso: new Date().toISOString(),
  appointmentDate: hoy, appointmentTime: '11:00', nextActionText: 'Llamar', nextActionDue: hoy, ...over,
});

describe('accesibilidad del CRM (H-024)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {} });
    useLeadStore.setState({ leads: [lead({}), lead({ id: 'b', fullName: 'Beto Soto', status: 'nuevo', appointmentDate: undefined })] });
  });
  afterEach(cleanup);

  it('reportes', async () => {
    const { container } = render(<Reports leads={useLeadStore.getState().leads} />);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
  it('agenda de visitas', async () => {
    const { container } = render(<Agenda leads={useLeadStore.getState().leads} onOpen={() => undefined} />);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
  it('historial de contacto', async () => {
    const { container } = render(<Timeline leadId="a" />);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
  it('próxima acción y "Para hoy"', async () => {
    const { container } = render(<><TodayPanel leads={useLeadStore.getState().leads} onOpen={() => undefined} /><NextActionEditor leadId="a" /></>);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
  it('pantalla del CRM con una ficha abierta', async () => {
    const { container } = render(<LeadsTab />);
    fireEvent.click(screen.getAllByText('Ana Rojas')[0]);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
