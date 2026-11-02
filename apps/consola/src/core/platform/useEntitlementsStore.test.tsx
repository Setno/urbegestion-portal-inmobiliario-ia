import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { useEntitlementsStore, useCan, useAccessMode, canNow, hasRoomNow } from './useEntitlementsStore';

const Muestra = () => {
  const chat = useCan('ai.chat');
  const modo = useAccessMode();
  return (
    <p>
      chat:{String(chat)} modo:{modo}
    </p>
  );
};

describe('useEntitlementsStore (derechos de la corredora)', () => {
  beforeEach(() => useEntitlementsStore.getState().reset());
  afterEach(() => cleanup());

  it('sin datos de ventas todo funciona completo', () => {
    expect(canNow('site.enabled')).toBe(true);
    expect(hasRoomNow('limit.agents', 500)).toBe(true);
  });

  it('aplicar lo de ventas cambia las funciones y los cupos', () => {
    useEntitlementsStore.getState().apply({ features: { 'ai.chat': false }, limits: { 'limit.agents': 2 } });
    expect(canNow('ai.chat')).toBe(false);
    expect(hasRoomNow('limit.agents', 1)).toBe(true);
    expect(hasRoomNow('limit.agents', 2)).toBe(false);
  });

  it('un mensaje más antiguo que el ya aplicado se ignora; uno igual o más nuevo se aplica', () => {
    const { apply } = useEntitlementsStore.getState();
    apply({ updatedAt: '2026-11-02T10:00:00Z', features: { 'ai.chat': false } });
    apply({ updatedAt: '2026-11-01T10:00:00Z', features: { 'ai.chat': true } });
    expect(canNow('ai.chat')).toBe(false);
    apply({ updatedAt: '2026-11-02T10:00:00Z', features: { 'ai.chat': false } });
    apply({ updatedAt: '2026-11-03T10:00:00Z', features: { 'ai.chat': true } });
    expect(canNow('ai.chat')).toBe(true);
  });

  it('repetir el mismo mensaje no cambia nada (idempotente)', () => {
    const { apply } = useEntitlementsStore.getState();
    const msg = { updatedAt: '2026-11-02T10:00:00Z', status: 'suspended', features: { 'crm.export': false } };
    apply(msg);
    const first = useEntitlementsStore.getState().entitlements;
    apply(msg);
    expect(useEntitlementsStore.getState().entitlements).toEqual(first);
  });

  it('los componentes se actualizan cuando ventas cambia los derechos', () => {
    render(<Muestra />);
    expect(screen.getByText('chat:true modo:full')).toBeTruthy();
    act(() => useEntitlementsStore.getState().apply({ status: 'suspended', features: { 'ai.chat': false } }));
    expect(screen.getByText('chat:false modo:read_only')).toBeTruthy();
  });
});

describe('useEntitlementsStore.loadPublic (sitio público)', () => {
  beforeEach(() => useEntitlementsStore.getState().reset());

  it('sin Supabase no cambia nada y todo sigue prendido', async () => {
    await useEntitlementsStore.getState().loadPublic();
    expect(canNow('ai.chat')).toBe(true);
  });
});
