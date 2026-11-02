import type { Property, PublicationStatus } from '../types/property';
import type { Role } from '../../../core/auth/permissions';
import type { PublicationMode } from '../../../core/auth/authService';

export const PUBLICATION_LABEL: Record<PublicationStatus, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  rechazada: 'Rechazada',
};

export type PublicationAction = 'enviar' | 'aprobar' | 'rechazar';

// Quién decide qué se publica: el publicador (administrador, o cualquier agente si la corredora publica directo)
// o el proponente (agente cuando la corredora exige aprobación). Sin roles (modo local) no hay flujo.
export type Actor = 'publicador' | 'proponente' | null;

export function actorFor(role: Role | null, mode: PublicationMode | undefined): Actor {
  if (!role) return null;
  return role === 'admin' || mode === 'directa' ? 'publicador' : 'proponente';
}

// Sin estado (datos antiguos o modo local) la propiedad cuenta como publicada.
export const isPublished = (p: Pick<Property, 'publicationStatus'>): boolean =>
  (p.publicationStatus ?? 'publicada') === 'publicada';

// El agente propone (borrador); el administrador decide y publica. Sin roles (modo local) no hay flujo.
export const statusForNew = (actor: Actor): PublicationStatus => (actor === 'proponente' ? 'borrador' : 'publicada');

// Si un agente cambia una propiedad ya publicada, vuelve a revisión hasta que el administrador la apruebe.
// (La base aplica la misma regla con un disparador; esto solo refleja el resultado en pantalla.)
export const statusAfterEdit = (actor: Actor, current: PublicationStatus): PublicationStatus =>
  actor === 'proponente' && current === 'publicada' ? 'en_revision' : current;

export function availableActions(actor: Actor, status: PublicationStatus): PublicationAction[] {
  if (actor === 'proponente') return status === 'borrador' || status === 'rechazada' ? ['enviar'] : [];
  if (actor === 'publicador') {
    if (status === 'en_revision') return ['aprobar', 'rechazar'];
    if (status === 'borrador' || status === 'rechazada') return ['aprobar'];
  }
  return [];
}
