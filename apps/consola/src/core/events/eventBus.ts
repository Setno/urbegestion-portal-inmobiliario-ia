// Emisor de eventos mínimo y tipado para que los módulos se comuniquen sin importarse entre sí.
export type EventBus<Events extends Record<string, unknown>> = {
  on: <K extends keyof Events>(name: K, handler: (payload: Events[K]) => void) => () => void;
  emit: <K extends keyof Events>(name: K, payload: Events[K]) => void;
};

export function createEventBus<Events extends Record<string, unknown>>(): EventBus<Events> {
  const handlers = new Map<keyof Events, Set<(payload: never) => void>>();

  return {
    on: (name, handler) => {
      const set = handlers.get(name) ?? new Set();
      set.add(handler as (payload: never) => void);
      handlers.set(name, set);
      return () => {
        set.delete(handler as (payload: never) => void);
      };
    },
    emit: (name, payload) => {
      // Un suscriptor que falla no debe impedir que los demás reciban el evento.
      for (const handler of [...(handlers.get(name) ?? [])]) {
        try {
          (handler as (p: typeof payload) => void)(payload);
        } catch (err) {
          console.warn("[eventBus] Falló un suscriptor de", String(name), err);
        }
      }
    },
  };
}
