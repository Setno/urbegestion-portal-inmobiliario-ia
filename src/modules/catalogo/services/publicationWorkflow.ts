import type { Property, PublicationStatus } from '../types/property';
import type { Role } from '../../../core/auth/permissions';

export const PUBLICATION_LABEL: Record<PublicationStatus, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  rechazada: 'Rechazada',
};

export type PublicationAction = 'enviar' | 'aprobar' | 'rechazar';

// Sin estado (datos antiguos o modo local) la propiedad cuenta como publicada.
export const isPublished = (p: Pick<Property, 'publicationStatus'>): boolean =>
  (p.publicationStatus ?? 'publicada') === 'publicada';

// El agente propone (borrador); el administrador decide y publica. Sin roles (modo local) no hay flujo.
export const statusForNew = (role: Role | null): PublicationStatus => (role === 'agente' ? 'borrador' : 'publicada');

// Si un agente cambia una propiedad ya publicada, vuelve a revisión hasta que el administrador la apruebe.
// (La base aplica la misma regla con un disparador; esto solo refleja el resultado en pantalla.)
export const statusAfterEdit = (role: Role | null, current: PublicationStatus): PublicationStatus =>
  role === 'agente' && current === 'publicada' ? 'en_revision' : current;

export function availableActions(role: Role | null, status: PublicationStatus): PublicationAction[] {
  if (role === 'agente') return status === 'borrador' || status === 'rechazada' ? ['enviar'] : [];
  if (role === 'admin') {
    if (status === 'en_revision') return ['aprobar', 'rechazar'];
    if (status === 'borrador' || status === 'rechazada') return ['aprobar'];
  }
  return [];
}
