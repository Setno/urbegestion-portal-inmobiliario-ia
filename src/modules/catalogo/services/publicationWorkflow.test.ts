import { describe, it, expect } from 'vitest';
import {
  isPublished,
  statusForNew,
  statusAfterEdit,
  availableActions,
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
      expect(statusForNew('agente')).toBe('borrador');
      expect(statusForNew('admin')).toBe('publicada');
      expect(statusForNew(null)).toBe('publicada');
    });
  });

  describe('statusAfterEdit', () => {
    it('si un agente edita una publicada, vuelve a revisión; el resto de los casos conserva el estado', () => {
      expect(statusAfterEdit('agente', 'publicada')).toBe('en_revision');
      expect(statusAfterEdit('agente', 'borrador')).toBe('borrador');
      expect(statusAfterEdit('agente', 'rechazada')).toBe('rechazada');
      expect(statusAfterEdit('admin', 'publicada')).toBe('publicada');
      expect(statusAfterEdit(null, 'publicada')).toBe('publicada');
    });
  });

  describe('availableActions', () => {
    it('el agente envía a revisión sus borradores y rechazadas, y nada más', () => {
      expect(availableActions('agente', 'borrador')).toEqual(['enviar']);
      expect(availableActions('agente', 'rechazada')).toEqual(['enviar']);
      expect(availableActions('agente', 'en_revision')).toEqual([]);
      expect(availableActions('agente', 'publicada')).toEqual([]);
    });

    it('el administrador aprueba o rechaza lo que está en revisión y puede publicar borradores y rechazadas', () => {
      expect(availableActions('admin', 'en_revision')).toEqual(['aprobar', 'rechazar']);
      expect(availableActions('admin', 'borrador')).toEqual(['aprobar']);
      expect(availableActions('admin', 'rechazada')).toEqual(['aprobar']);
      expect(availableActions('admin', 'publicada')).toEqual([]);
    });

    it('sin roles (modo local) no hay flujo de aprobación', () => {
      expect(availableActions(null, 'borrador')).toEqual([]);
    });
  });

  it('cada estado tiene una etiqueta en español', () => {
    expect(PUBLICATION_LABEL.en_revision).toBe('En revisión');
    expect(PUBLICATION_LABEL.publicada).toBe('Publicada');
  });
});
