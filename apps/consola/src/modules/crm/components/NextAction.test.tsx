import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { LeadsTab } from './LeadsTab';
import { useLeadStore } from '../stores/useLeadStore';
import { localToday } from '../services/leadTasks';
import type { Lead } from '../types/lead';

const hoy = localToday();
const lead = (over: Partial<Lead>): Lead => ({
  id: 'x', fullName: 'Sin Nombre', email: 'x@e.cl', phone: '+56 9 0000 0000', operationInterest: 'compra',
  status: 'contactado', notes: [], source: 'formulario_contacto', createdAt: '2026-01-01', ...over,
});

describe('Próxima acción en el CRM (H-056)', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({
      leads: [
        lead({ id: 'v', fullName: 'Vera Vencida', nextActionText: 'Llamar', nextActionDue: '2026-01-02' }),
        lead({ id: 'h', fullName: 'Hugo Hoy', nextActionText: 'Enviar ficha', nextActionDue: hoy }),
        lead({ id: 's', fullName: 'Sara Sinaccion' }),
        lead({ id: 'c', fullName: 'Carlos Cerrado', status: 'cerrado' }),
      ],
    });
  });
  afterEach(cleanup);

  it('"Para hoy" lista vencidas, de hoy y sin acción, y deja fuera los cerrados', () => {
    render(<LeadsTab />);
    const panel = screen.getByRole('region', { name: 'Para hoy' });
    const botones = within(panel).getAllByRole('button').map((b) => b.textContent ?? '');
    expect(botones).toHaveLength(3);
    expect(botones[0]).toContain('Vera Vencida');
    expect(botones[0]).toContain('Vencida');
    expect(botones[1]).toContain('Hugo Hoy');
    expect(botones[2]).toContain('Sin próxima acción');
    expect(within(panel).queryByText(/Carlos/)).toBeNull();
  });

  it('desde la ficha se guarda una acción y luego se marca hecha, dejando una nota', () => {
    render(<LeadsTab />);
    fireEvent.click(within(screen.getByRole('region', { name: 'Para hoy' })).getByText('Sara Sinaccion'));
    fireEvent.change(screen.getByLabelText('Acción a realizar'), { target: { value: 'Confirmar visita' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(useLeadStore.getState().leads.find((l) => l.id === 's')?.nextActionText).toBe('Confirmar visita');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar hecha' }));
    const s = useLeadStore.getState().leads.find((l) => l.id === 's')!;
    expect(s.nextActionText).toBeUndefined();
    expect(screen.getByText(/Hecho: Confirmar visita/)).toBeTruthy();
  });

  it('sin texto no guarda y avisa', () => {
    render(<LeadsTab />);
    fireEvent.click(within(screen.getByRole('region', { name: 'Para hoy' })).getByText('Sara Sinaccion'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText(/Escribe la acción/)).toBeTruthy();
    expect(useLeadStore.getState().leads.find((l) => l.id === 's')?.nextActionText).toBeUndefined();
  });
});
