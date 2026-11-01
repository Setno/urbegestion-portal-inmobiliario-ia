import { describe, it, expect } from 'vitest';
import {
  isPublished,
  statusForNew,
  statusAfterEdit,
  availableActions,
  actorFor,
  PUBLICATION_LABEL,
} from './publicationWorkflow';
import type { Property } from '../types/property';

const prop = (publicationStatus?: Property['publicationStatus']) => ({ publicationStatus }) as Property;

describe('publicationWorkflow', () => {
  describe('isPublished', () => {
    it('solo las publicadas se muestran en el sitio; sin estado cuenta como publicada (datos antiguos y modo local)', () => {
      expect(isPublished(prop('publicada'))).toBe(true);
      expect(isPublished(prop(undefined))).toBe(true);
      expect(isPublished(prop('borrador'))).toBe(false);
      expect(isPublished(prop('en_revision'))).toBe(false);
      expect(isPublished(prop('rechazada'))).toBe(false);
    });
  });

  describe('statusForNew', () => {
    it('un agente crea en borrador; el administrador publica directo; sin roles (modo local) publica', () => {
      expect(statusForNew('proponente')).toBe('borrador');
      expect(statusForNew('publicador')).toBe('publicada');
      expect(statusForNew(null)).toBe('publicada');
    });
  });

  describe('statusAfterEdit', () => {
    it('si un agente edita una publicada, vuelve a revisión; el resto de los casos conserva el estado', () => {
      expect(statusAfterEdit('proponente', 'publicada')).toBe('en_revision');
      expect(statusAfterEdit('proponente', 'borrador')).toBe('borrador');
      expect(statusAfterEdit('proponente', 'rechazada')).toBe('rechazada');
      expect(statusAfterEdit('publicador', 'publicada')).toBe('publicada');
      expect(statusAfterEdit(null, 'publicada')).toBe('publicada');
    });
  });

  describe('availableActions', () => {
    it('el proponente envía a revisión sus borradores y rechazadas, y nada más', () => {
      expect(availableActions('proponente', 'borrador')).toEqual(['enviar']);
      expect(availableActions('proponente', 'rechazada')).toEqual(['enviar']);
      expect(availableActions('proponente', 'en_revision')).toEqual([]);
      expect(availableActions('proponente', 'publicada')).toEqual([]);
    });

    it('el publicador aprueba o rechaza lo que está en revisión y puede publicar borradores y rechazadas', () => {
      expect(availableActions('publicador', 'en_revision')).toEqual(['aprobar', 'rechazar']);
      expect(availableActions('publicador', 'borrador')).toEqual(['aprobar']);
      expect(availableActions('publicador', 'rechazada')).toEqual(['aprobar']);
      expect(availableActions('publicador', 'publicada')).toEqual([]);
    });

    it('sin roles (modo local) no hay flujo de aprobación', () => {
      expect(availableActions(null, 'borrador')).toEqual([]);
    });
  });

  describe('actorFor', () => {
    it('el administrador siempre publica; el agente solo propone si la corredora exige aprobación', () => {
      expect(actorFor('admin', 'con_aprobacion')).toBe('publicador');
      expect(actorFor('agente', 'con_aprobacion')).toBe('proponente');
      expect(actorFor('agente', undefined)).toBe('proponente');
    });

    it('si la corredora publica directo, el agente también publica y responde por lo suyo', () => {
      expect(actorFor('agente', 'directa')).toBe('publicador');
    });

    it('sin rol (modo local) no hay flujo', () => {
      expect(actorFor(null, 'directa')).toBeNull();
    });
  });

  it('cada estado tiene una etiqueta en español', () => {
    expect(PUBLICATION_LABEL.en_revision).toBe('En revisión');
    expect(PUBLICATION_LABEL.publicada).toBe('Publicada');
  });
});
