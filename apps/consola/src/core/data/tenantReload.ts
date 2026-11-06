import { onTenantChange } from './dataSource';
import { useLeadStore } from '../../modules/crm/stores/useLeadStore';
import { useTimelineStore } from '../../modules/crm/stores/useTimelineStore';
import { usePropertyStore } from '../../modules/catalogo/stores/usePropertyStore';
import { useMarketStore } from '../market/useMarketStore';
import { useEntitlementsStore } from '../platform/useEntitlementsStore';
import { useBrandStore } from '../brand/useBrandStore';

// H-064: cuando cambia la corredora (entrar, salir, cambiar de cuenta) las tiendas no pueden quedarse con datos de la anterior.
// Primero se vacía TODO lo que es de la corredora; después, si hay una corredora nueva, se recarga lo público
// (los leads y el historial los pide el panel al abrirse con sesión). Las cargas lentas de la anterior se descartan solas.
export function registerTenantReload(): () => void {
  return onTenantChange((tenantId) => {
    useLeadStore.getState().reset();
    useTimelineStore.getState().reset();
    usePropertyStore.getState().reset();
    useMarketStore.getState().reset();
    useEntitlementsStore.getState().reset();
    useBrandStore.getState().reset();
    if (!tenantId) return;
    void usePropertyStore.getState().load();
    void useMarketStore.getState().load();
    void useEntitlementsStore.getState().loadPublic();
    void useBrandStore.getState().load();
  });
}
