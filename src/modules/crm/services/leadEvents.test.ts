import { describe, it, expect, beforeEach } from 'vitest';
import { appEvents } from '../../../core/events/appEvents';
import { useLeadStore } from '../stores/useLeadStore';
import { registerLeadEvents } from './leadEvents';
import { registerLeadFromChat } from '../../captacion/services/aiService';

describe('evento lead.created', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({ leads: [] });
  });

  it('crea el lead en CRM cuando Captación emite lead.created', () => {
    const cancelar = registerLeadEvents();

    appEvents.emit('lead.created', {
      lead: {
        fullName: 'Ana Prueba',
        email: 'ana@correo.cl',
        phone: '+56 9 1111 2222',
        operationInterest: 'compra',
        status: 'nuevo',
        notes: [],
        source: 'asistente_ia',
      },
    });

    const leads = useLeadStore.getState().leads;
    expect(leads).toHaveLength(1);
    expect(leads[0].fullName).toBe('Ana Prueba');
    expect(leads[0].id).toBeTruthy();
    cancelar();
  });

  it('registrar dos veces no duplica el lead', () => {
    const c1 = registerLeadEvents();
    const c2 = registerLeadEvents();

    registerLeadFromChat('Luis', '+56 9 3333 4444', '');

    expect(useLeadStore.getState().leads).toHaveLength(1);
    c1();
    c2();
  });

  it('el chat de Captación deja el lead en CRM mediante el evento', () => {
    const cancelar = registerLeadEvents();
    registerLeadFromChat('María', '+56 9 5555 6666', 'm@correo.cl', { propertyTitle: 'Casa X' });
    const lead = useLeadStore.getState().leads[0];
    expect(lead.fullName).toBe('María');
    expect(lead.propertyTitle).toBe('Casa X');
    cancelar();
  });

  it('Captación y la ficha de propiedad ya no importan el almacén de CRM', () => {
    const archivos = import.meta.glob(
      [
        '../../captacion/services/aiService.ts',
        '../../captacion/components/OwnerValuation.tsx',
        '../../captacion/components/CalBookingModal.tsx',
        '../../catalogo/components/PropertyModal.tsx',
      ],
      { query: '?raw', import: 'default', eager: true },
    ) as Record<string, string>;
    expect(Object.keys(archivos)).toHaveLength(4);
    for (const [ruta, texto] of Object.entries(archivos)) {
      expect(texto, ruta).not.toMatch(/crm\/stores\/useLeadStore/);
    }
  });

  it('el chat pasa el aviso de privacidad al lead guardado', () => {
    const cancelar = registerLeadEvents();
    const privacyNotice = { shownAt: '2026-11-01T15:00:00.000Z', version: 'v-test', purpose: 'contacto_por_consulta' };
    registerLeadFromChat('Rosa', '+56 9 7777 8888', '', { privacyNotice });
    expect(useLeadStore.getState().leads[0].privacyNotice).toEqual(privacyNotice);
    cancelar();
  });

  it('los cuatro formularios que capturan datos muestran el aviso de privacidad y registran qué aviso se mostró', () => {
    const formularios = import.meta.glob(
      [
        '../../captacion/components/AiChatWidget.tsx',
        '../../captacion/components/OwnerValuation.tsx',
        '../../captacion/components/CalBookingModal.tsx',
        '../../catalogo/components/PropertyModal.tsx',
      ],
      { query: '?raw', import: 'default', eager: true },
    ) as Record<string, string>;
    expect(Object.keys(formularios)).toHaveLength(4);
    for (const [ruta, texto] of Object.entries(formularios)) {
      expect(texto, ruta).toMatch(/<PrivacyNotice \/>/);
      expect(texto, ruta).toMatch(/privacyNotice: buildPrivacyNotice\(\)/);
    }
  });
});

