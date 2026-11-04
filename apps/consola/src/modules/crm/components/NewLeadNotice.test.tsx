import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { NewLeadNotice } from './NewLeadNotice';
import { useLeadStore } from '../stores/useLeadStore';
import { subscribeNewLeads } from '../services/leadRealtime';
import type { Lead } from '../types/lead';

vi.mock('../services/leadRealtime', () => ({ subscribeNewLeads: vi.fn() }));

const lead: Lead = {
  id: 'l-nuevo',
  fullName: 'Luis Soto',
  email: '',
  phone: '+56911112222',
  propertyTitle: 'Casa con vista',
  operationInterest: 'compra',
  status: 'visita_agendada',
  appointmentDate: '2026-11-05',
  notes: [],
  source: 'ficha_propiedad',
  createdAt: '2026-11-03',
};

describe('NewLeadNotice (aviso en vivo, H-054)', () => {
  let entregar: (l: Lead) => void = () => undefined;
  const dejarDeEscuchar = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    useLeadStore.setState({ leads: [] });
    dejarDeEscuchar.mockReset();
    vi.mocked(subscribeNewLeads).mockReset().mockImplementation((onLead) => {
      entregar = onLead;
      return dejarDeEscuchar;
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('muestra el lead nuevo, lo suma al CRM y lleva al CRM al tocarlo', () => {
    const abrirCrm = vi.fn();
    render(<NewLeadNotice active onOpenCrm={abrirCrm} />);
    act(() => entregar(lead));
    expect(screen.getByText('Nuevo lead: Luis Soto')).toBeTruthy();
    expect(screen.getByText(/Casa con vista · pide visita el 05-11-2026/)).toBeTruthy();
    expect(useLeadStore.getState().leads.map((l) => l.id)).toEqual(['l-nuevo']);
    fireEvent.click(screen.getByText('Ver en el CRM'));
    expect(abrirCrm).toHaveBeenCalled();
    expect(screen.queryByText('Nuevo lead: Luis Soto')).toBeNull();
  });

  it('un lead que ya estaba en la lista (por ejemplo, uno creado aquí mismo) no se duplica ni se avisa', () => {
    useLeadStore.setState({ leads: [lead] });
    render(<NewLeadNotice active onOpenCrm={vi.fn()} />);
    act(() => entregar(lead));
    expect(useLeadStore.getState().leads).toHaveLength(1);
    expect(screen.queryByText('Nuevo lead: Luis Soto')).toBeNull();
  });

  it('el aviso se cierra solo a los 10 segundos', () => {
    render(<NewLeadNotice active onOpenCrm={vi.fn()} />);
    act(() => entregar(lead));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByText('Nuevo lead: Luis Soto')).toBeNull();
  });

  it('sin acceso al CRM no escucha, y al cerrar el panel deja de escuchar', () => {
    const { rerender, unmount } = render(<NewLeadNotice active={false} onOpenCrm={vi.fn()} />);
    expect(subscribeNewLeads).not.toHaveBeenCalled();
    rerender(<NewLeadNotice active onOpenCrm={vi.fn()} />);
    expect(subscribeNewLeads).toHaveBeenCalledTimes(1);
    unmount();
    expect(dejarDeEscuchar).toHaveBeenCalled();
  });
});
