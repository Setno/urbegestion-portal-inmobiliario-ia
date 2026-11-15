import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, act, waitFor } from '@testing-library/react';
import { LeadsTab } from './LeadsTab';
import { useLeadStore } from '../stores/useLeadStore';
import { useTeamStore } from '../stores/useTeamStore';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import { usePropertyStore } from '../../catalogo/stores/usePropertyStore';
import type { Lead } from '../types/lead';
import type { Role } from '../../../core/auth/permissions';

const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Sin Nombre', email: '', phone: '+56 9 0000 0000', operationInterest: 'compra',
  status: 'nuevo', notes: [], source: 'formulario_contacto', createdAt: '2026-11-01', ...over,
});

const ana = lead({ id: 'a', fullName: 'Ana Rojas', assignedTo: 'agente-1' });
const beto = lead({ id: 'b', fullName: 'Beto Soto', assignedTo: 'agente-2' });
const carla = lead({ id: 'c', fullName: 'Carla Díaz' });

const team = [
  { userId: 'admin-1', email: 'jefa@corredora.cl', role: 'admin' as const },
  { userId: 'agente-1', email: 'pedro@corredora.cl', role: 'agente' as const },
  { userId: 'agente-2', email: 'sofia@corredora.cl', role: 'agente' as const },
];

const sesion = (role: Role, userId: string) =>
  useAuthStore.setState({ membership: { tenantId: 'tenant-1', tenantName: 'Corredora', role, userId, publicationMode: 'con_aprobacion' } });

const abrirTabla = () => fireEvent.click(screen.getByRole('button', { name: /Tabla Lista/ }));
const filtro = () => screen.getByRole('combobox', { name: 'Filtrar por responsable' }) as HTMLSelectElement;
// Fila de la tabla (el nombre también aparece en el panel "Hoy", por eso se busca dentro de las filas)
const fila = (nombre: string) => screen.getAllByRole('row').slice(1).find((r) => within(r).queryByText(nombre))!;
const verFicha = (nombre: string) => fireEvent.click(within(fila(nombre)).getByRole('button', { name: 'Ver Ficha' }));

describe('LeadsTab: asignación de leads (H-069.1)', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({ leads: [ana, beto, carla] });
    usePropertyStore.setState({ properties: [] });
    useTeamStore.setState({ members: team, status: 'ready' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    cleanup();
    useTeamStore.setState({ members: [], status: 'idle' });
    useAuthStore.setState({ membership: null });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('un agente abre el CRM en "Mis leads" y puede ver todos o los sin asignar', () => {
    sesion('agente', 'agente-1');
    render(<LeadsTab />);
    expect(filtro().value).toBe('mine');
    expect(screen.getByText('1 de 3 leads')).toBeTruthy();
    fireEvent.change(filtro(), { target: { value: 'all' } });
    expect(screen.getByText('3 de 3 leads')).toBeTruthy();
    fireEvent.change(filtro(), { target: { value: 'unassigned' } });
    expect(screen.getByText('1 de 3 leads')).toBeTruthy();
    abrirTabla();
    expect(fila('Carla Díaz')).toBeTruthy();
    expect(fila('Ana Rojas')).toBeUndefined();
  });

  it('el administrador abre en "Todos" y puede filtrar por un agente', () => {
    sesion('admin', 'admin-1');
    render(<LeadsTab />);
    expect(filtro().value).toBe('all');
    fireEvent.change(filtro(), { target: { value: 'agente-2' } });
    expect(screen.getByText('1 de 3 leads')).toBeTruthy();
    abrirTabla();
    expect(fila('Beto Soto')).toBeTruthy();
  });

  it('la tabla muestra el responsable de cada lead', () => {
    sesion('admin', 'admin-1');
    render(<LeadsTab />);
    abrirTabla();
    expect(within(fila('Ana Rojas')).getByText('pedro@corredora.cl')).toBeTruthy();
    expect(within(fila('Carla Díaz')).getByText('Sin asignar')).toBeTruthy();
  });

  it('el administrador cambia el responsable desde la ficha', () => {
    sesion('admin', 'admin-1');
    render(<LeadsTab />);
    abrirTabla();
    verFicha('Carla Díaz');
    fireEvent.change(screen.getByRole('combobox', { name: 'Responsable del lead' }), { target: { value: 'agente-2' } });
    expect(useLeadStore.getState().leads.find((l) => l.id === 'c')?.assignedTo).toBe('agente-2');
  });

  it('un agente toma un lead sin responsable y suelta el suyo; en el de otro solo ve quién lo tiene', () => {
    sesion('agente', 'agente-1');
    render(<LeadsTab />);
    fireEvent.change(filtro(), { target: { value: 'all' } });
    abrirTabla();

    verFicha('Carla Díaz');
    fireEvent.click(screen.getByRole('button', { name: 'Tomar este lead' }));
    expect(useLeadStore.getState().leads.find((l) => l.id === 'c')?.assignedTo).toBe('agente-1');
    fireEvent.click(screen.getByRole('button', { name: 'Soltar este lead' }));
    expect(useLeadStore.getState().leads.find((l) => l.id === 'c')?.assignedTo).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la ficha' }));

    verFicha('Beto Soto');
    expect(screen.queryByRole('button', { name: 'Tomar este lead' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Responsable del lead' })).toBeNull();
    expect(screen.getAllByText('sofia@corredora.cl').length).toBeGreaterThan(0);
  });

  it('el equipo llega después de abrir el CRM: el agente queda en "Mis leads" al aparecer', () => {
    useTeamStore.setState({ members: [], status: 'loading' });
    sesion('agente', 'agente-1');
    render(<LeadsTab />);
    expect(screen.getByText('3 de 3 leads')).toBeTruthy();
    act(() => useTeamStore.setState({ members: team, status: 'ready' }));
    expect(filtro().value).toBe('mine');
    expect(screen.getByText('1 de 3 leads')).toBeTruthy();
  });

  it('si la persona eligió otro filtro, una recarga del equipo no se lo cambia', () => {
    sesion('agente', 'agente-1');
    render(<LeadsTab />);
    fireEvent.change(filtro(), { target: { value: 'all' } });
    act(() => useTeamStore.setState({ members: [...team], status: 'ready' }));
    expect(filtro().value).toBe('all');
  });

  it('si el agente elegido en el filtro ya no está en el equipo, vuelve al filtro inicial', () => {
    sesion('admin', 'admin-1');
    render(<LeadsTab />);
    fireEvent.change(filtro(), { target: { value: 'agente-2' } });
    act(() => useTeamStore.setState({ members: team.filter((m) => m.userId !== 'agente-2'), status: 'ready' }));
    expect(filtro().value).toBe('all');
    expect(screen.getByText('3 de 3 leads')).toBeTruthy();
  });

  it('si la base rechaza el cambio, avisa en esa ficha, vuelve al valor anterior y el aviso no pasa a otra ficha', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const original = useLeadStore.getState().assignLead;
    useLeadStore.setState({ assignLead: vi.fn().mockResolvedValue(false) });
    try {
      sesion('admin', 'admin-1');
      render(<LeadsTab />);
      abrirTabla();
      verFicha('Carla Díaz');
      fireEvent.change(screen.getByRole('combobox', { name: 'Responsable del lead' }), { target: { value: 'agente-2' } });
      await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No se pudo cambiar el responsable'));
      expect((screen.getByRole('combobox', { name: 'Responsable del lead' }) as HTMLSelectElement).value).toBe('');
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar la ficha' }));
      verFicha('Ana Rojas');
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      useLeadStore.setState({ assignLead: original });
    }
  });

  it('sin equipo (datos en el navegador) no aparece nada de la asignación', () => {
    useTeamStore.setState({ members: [], status: 'idle' });
    sesion('agente', 'agente-1');
    render(<LeadsTab />);
    expect(screen.queryByRole('combobox', { name: 'Filtrar por responsable' })).toBeNull();
    expect(screen.getByText('3 de 3 leads')).toBeTruthy();
  });

  it('Reportes muestra la tabla por agente', () => {
    sesion('admin', 'admin-1');
    render(<LeadsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Reportes/ }));
    const tabla = screen.getByRole('region', { name: 'Por agente' });
    expect(within(tabla).getByText('pedro@corredora.cl')).toBeTruthy();
    expect(within(tabla).getByText('Sin asignar')).toBeTruthy();
  });
});
