import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { Agenda } from './Agenda';
import { useLeadStore } from '../stores/useLeadStore';
import { useTimelineStore } from '../stores/useTimelineStore';
import { localToday } from '../services/leadTasks';
import { formatDay } from '../services/leadAgenda';
import type { Lead } from '../types/lead';

const hoy = localToday();
const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Sin Nombre', email: '', phone: '+56 9 0000 0000', operationInterest: 'compra',
  status: 'visita_agendada', notes: [], source: 'formulario_contacto', createdAt: '2026-01-01', ...over,
});

const Wrapper = () => {
  const leads = useLeadStore((s) => s.leads);
  return <Agenda leads={leads} onOpen={() => undefined} />;
};

describe('Agenda de visitas (H-059)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {} });
    useLeadStore.setState({
      leads: [
        lead({ id: 'a', fullName: 'Ana Rojas', appointmentDate: hoy, appointmentTime: '11:00', propertyTitle: 'Casa en Vitacura' }),
        lead({ id: 'b', fullName: 'Beto Soto', appointmentDate: hoy, appointmentTime: '11:00' }),
        lead({ id: 'c', fullName: 'Carla Díaz', appointmentDate: hoy, appointmentTime: '15:30' }),
      ],
    });
  });
  afterEach(cleanup);

  it('muestra las visitas del día ordenadas por hora, con su propiedad', () => {
    render(<Wrapper />);
    const panel = screen.getByRole('region', { name: `Visitas del ${formatDay(hoy)}` });
    const filas = within(panel).getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(filas).toHaveLength(3);
    expect(filas[2]).toContain('15:30');
    expect(within(panel).getByText(/Casa en Vitacura/)).toBeTruthy();
  });

  it('avisa del choque cuando dos visitas coinciden en día y hora', () => {
    render(<Wrapper />);
    expect(screen.getAllByText(/Choque de horario/)).toHaveLength(2);
  });

  it('el día del calendario muestra cuántas visitas tiene', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: `Día ${hoy}, 3 visitas, hay choque de horario` })).toBeTruthy();
  });

  it('reagendar mueve la visita, actualiza el lead y deja un evento en el historial', () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByLabelText('Hora de la visita de Beto Soto'), { target: { value: '12:00' } });
    const fila = screen.getByLabelText('Hora de la visita de Beto Soto').closest('li')!;
    fireEvent.click(within(fila).getByRole('button', { name: 'Reagendar' }));
    expect(useLeadStore.getState().leads.find((l) => l.id === 'b')?.appointmentTime).toBe('12:00');
    expect(screen.queryAllByText(/Choque de horario/)).toHaveLength(0);
    const evento = useTimelineStore.getState().events['b'][0];
    expect(evento.kind).toBe('visita');
    expect(evento.text).toContain('12:00');
  });

  it('una fecha vacía no se guarda y avisa', () => {
    render(<Wrapper />);
    const fila = screen.getByLabelText('Fecha de la visita de Ana Rojas').closest('li')!;
    fireEvent.change(screen.getByLabelText('Fecha de la visita de Ana Rojas'), { target: { value: '' } });
    fireEvent.click(within(fila).getByRole('button', { name: 'Reagendar' }));
    expect(screen.getByText(/fecha y una hora válidas/)).toBeTruthy();
    expect(useLeadStore.getState().leads.find((l) => l.id === 'a')?.appointmentDate).toBe(hoy);
  });

  it('un día sin visitas lo dice', () => {
    render(<Wrapper />);
    const mañana = screen.getAllByRole('button').find((b) => /^Día \d{4}-\d{2}-\d{2}$/.test(b.getAttribute('aria-label') ?? ''))!;
    fireEvent.click(mañana);
    expect(screen.getByText('No hay visitas agendadas este día.')).toBeTruthy();
  });
});

describe('Agenda: navegación y aviso (H-059)', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimelineStore.setState({ events: {} });
    useLeadStore.setState({ leads: [lead({ id: 'a', fullName: 'Ana Rojas', appointmentDate: hoy, appointmentTime: '11:00' })] });
  });
  afterEach(cleanup);

  it('al cambiar de mes el día elegido queda dentro de ese mes', () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    const titulo = screen.getByRole('region', { name: /Visitas del 1 de/ });
    expect(titulo).toBeTruthy();
  });

  it('al reagendar a otro mes el calendario salta a la nueva fecha y avisa', () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByLabelText('Fecha de la visita de Ana Rojas'), { target: { value: '2027-02-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reagendar' }));
    expect(screen.getByRole('status').textContent).toBe('Visita de Ana Rojas movida al 10 de febrero.');
    expect(screen.getByRole('region', { name: 'Visitas del 10 de febrero' })).toBeTruthy();
    expect(screen.getByLabelText('Fecha de la visita de Ana Rojas')).toBeTruthy();
  });
});
