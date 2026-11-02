import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from './eventBus';

describe('eventBus', () => {
  it('entrega el evento a quienes se suscribieron a ese nombre', () => {
    const bus = createEventBus<{ 'lead.created': { id: string }; otro: number }>();
    const alCrear = vi.fn();
    const alOtro = vi.fn();
    bus.on('lead.created', alCrear);
    bus.on('otro', alOtro);

    bus.emit('lead.created', { id: 'a' });

    expect(alCrear).toHaveBeenCalledWith({ id: 'a' });
    expect(alOtro).not.toHaveBeenCalled();
  });

  it('deja de entregar después de cancelar la suscripción', () => {
    const bus = createEventBus<{ x: number }>();
    const fn = vi.fn();
    const cancelar = bus.on('x', fn);
    cancelar();
    bus.emit('x', 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('un suscriptor que falla no impide que los demás reciban el evento', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bus = createEventBus<{ x: number }>();
    const segundo = vi.fn();
    bus.on('x', () => {
      throw new Error('falla');
    });
    bus.on('x', segundo);

    bus.emit('x', 1);

    expect(segundo).toHaveBeenCalledWith(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
