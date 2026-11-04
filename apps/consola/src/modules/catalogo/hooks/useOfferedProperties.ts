import { useMemo } from 'react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { isOnOffer, isPublished } from '../services/publicationWorkflow';
import { isInServiceAreas } from '../services/propertyFilters';
import { useMarket } from '../../../core/market/useMarketStore';
import type { Property } from '../types/property';

// Lo que el sitio ofrece a los visitantes: lo publicado, aún no vendido ni arrendado, y que está dentro de las zonas de trabajo de la corredora.
// Lo usan el buscador, la grilla y el chat, para que nunca muestren cosas distintas.
export function useOfferedProperties(): Property[] {
  const all = usePropertyStore((s) => s.properties);
  const view = useMarket();
  return useMemo(
    () => all.filter((p) => isPublished(p) && isOnOffer(p) && isInServiceAreas(p, view, view.pack)),
    [all, view],
  );
}
