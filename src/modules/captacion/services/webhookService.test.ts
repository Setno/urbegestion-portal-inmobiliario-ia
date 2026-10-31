import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webhookService } from './webhookService';
import type { Lead } from '../../crm/types/lead';

const lead: Lead = {
  id: 'lead-1',
  fullName: 'Ana María Prueba',
  email: 'ana@prueba.cl',
  phone: '+56 9 1111 2222',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
  createdAt: '2026-10-30',
};

const responder = (status: number, body: unknown = {}) =>
  vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('webhookService.dispatchLeadToGHL', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('informa éxito cuando el servidor responde 200', async () => {
    vi.stubGlobal('fetch', responder(200, { ok: true }));
    const r = await webhookService.dispatchLeadToGHL(lead);
    expect(r.success).toBe(true);
    expect(localStorage.getItem('urbe_ghl_last_status')).toBe('success');
  });

  it('envía el contacto separando nombre y apellido', async () => {
    const fetchMock = responder(200);
    vi.stubGlobal('fetch', fetchMock);
    await webhookService.dispatchLeadToGHL(lead);
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.contact.firstName).toBe('Ana');
    expect(cuerpo.contact.lastName).toBe('María Prueba');
    expect(cuerpo.contact.email).toBe('ana@prueba.cl');
  });

  it('devuelve un fallo con mensaje claro cuando el webhook no está configurado (503)', async () => {
    vi.stubGlobal('fetch', responder(503));
    const r = await webhookService.dispatchLeadToGHL(lead);
    expect(r.success).toBe(false);
    expect(r.message).toContain('GHL_WEBHOOK_URL');
    expect(localStorage.getItem('urbe_ghl_last_status')).toBe('error');
  });

  it('devuelve un fallo que menciona vercel dev cuando el endpoint no existe (404)', async () => {
    vi.stubGlobal('fetch', responder(404));
    const r = await webhookService.dispatchLeadToGHL(lead);
    expect(r.success).toBe(false);
    expect(r.message).toContain('vercel dev');
  });

  it('devuelve un fallo (sin lanzar excepción) cuando falla la red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    const r = await webhookService.dispatchLeadToGHL(lead);
    expect(r.success).toBe(false);
    expect(r.message).toContain('No se pudo contactar');
  });

  it('no envía nada cuando el envío está desactivado', async () => {
    const fetchMock = responder(200);
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('urbe_ghl_enabled', 'false');
    const r = await webhookService.dispatchLeadToGHL(lead);
    expect(r.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('webhookService.checkStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve "active" cuando el servidor tiene el webhook configurado', async () => {
    vi.stubGlobal('fetch', responder(200, { configured: true }));
    expect(await webhookService.checkStatus()).toBe('active');
  });

  it('devuelve "inactive" cuando el servidor no lo tiene configurado', async () => {
    vi.stubGlobal('fetch', responder(200, { configured: false }));
    expect(await webhookService.checkStatus()).toBe('inactive');
  });

  it('devuelve "unreachable" cuando el endpoint no existe o falla', async () => {
    vi.stubGlobal('fetch', responder(404));
    expect(await webhookService.checkStatus()).toBe('unreachable');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(await webhookService.checkStatus()).toBe('unreachable');
  });
});
