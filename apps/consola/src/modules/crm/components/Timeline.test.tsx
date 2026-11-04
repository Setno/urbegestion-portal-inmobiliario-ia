import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Timeline } from './Timeline';
import { useTimelineStore } from '../stores/useTimelineStore';
import { setLeadEventRepository } from '../services/leadEventRepository';

describe('Timeline (H-057)', () => {
  beforeEach(() => {
    localStorage.clear();
    setLeadEventRepository(null);
    useTimelineStore.setState({ events: {} });
  });
  afterEach(cleanup);

  it('sin historial dice que está vacío', () => {
    render(<Timeline leadId="l1" />);
    expect(screen.getByText('Aún no hay contactos registrados.')).toBeTruthy();
  });

  it('registra una llamada y la muestra con su tipo, autor y fecha', () => {
    render(<Timeline leadId="l1" />);
    fireEvent.change(screen.getByLabelText('Tipo de contacto'), { target: { value: 'llamada' } });
    fireEvent.change(screen.getByLabelText('Detalle del contacto'), { target: { value: 'Quedó en confirmar el viernes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    const item = screen.getByText('Quedó en confirmar el viernes').closest('li')!;
    expect(item.textContent).toContain('Llamada');
    expect(screen.queryByText('Aún no hay contactos registrados.')).toBeNull();
  });

  it('sin detalle no registra y avisa', () => {
    render(<Timeline leadId="l1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(screen.getByText(/Escribe qué pasó/)).toBeTruthy();
    expect(useTimelineStore.getState().events['l1']).toBeUndefined();
  });
});
