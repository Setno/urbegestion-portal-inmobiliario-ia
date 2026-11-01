import { Lead } from '../../crm/types/lead';
import { agencyConfig } from '../../../core/config/agencyConfig';

export type WebhookStatus = 'active' | 'inactive' | 'unreachable';

export interface WebhookConfig {
  calComUrl: string;
  isEnabled: boolean;
  lastDispatchedAt?: string;
  lastStatus?: 'success' | 'error' | null;
}

export class WebhookService {
  private static instance: WebhookService;

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  public getWebhookConfig(): WebhookConfig {
    const env = import.meta.env;
    const localCal = localStorage.getItem('urbe_cal_url') || '';
    const isEnabled = localStorage.getItem('urbe_ghl_enabled') !== 'false';

    return {
      calComUrl: localCal || env.VITE_CAL_COM_URL || agencyConfig.aiAgent.calendarUrl || 'https://cal.com/urbegestion/visita-propiedad',
      isEnabled,
      lastDispatchedAt: localStorage.getItem('urbe_ghl_last_dispatch') || undefined,
      lastStatus: (localStorage.getItem('urbe_ghl_last_status') as WebhookConfig['lastStatus']) || null
    };
  }

  public saveWebhookConfig(config: { calComUrl?: string; isEnabled?: boolean }): void {
    if (config.calComUrl !== undefined) {
      localStorage.setItem('urbe_cal_url', config.calComUrl.trim());
      agencyConfig.aiAgent.calendarUrl = config.calComUrl.trim();
    }
    if (config.isEnabled !== undefined) {
      localStorage.setItem('urbe_ghl_enabled', config.isEnabled ? 'true' : 'false');
    }
  }

  /**
   * Consulta al servidor si el webhook está configurado (no revela la URL)
   */
  public async checkStatus(): Promise<WebhookStatus> {
    try {
      const response = await fetch('/api/lead-webhook', { method: 'GET' });
      if (!response.ok) return 'unreachable';
      const data = await response.json();
      return data.configured ? 'active' : 'inactive';
    } catch {
      return 'unreachable';
    }
  }

  /**
   * Dispatches a captured lead to GoHighLevel (or Zapier / Make / n8n) via Webhook
   */
  public async dispatchLeadToGHL(lead: Lead): Promise<{ success: boolean; message: string }> {
    const config = this.getWebhookConfig();

    if (!config.isEnabled) {
      return { success: false, message: 'El envío de leads está desactivado.' };
    }

    // Split name into first and last name for GHL contact mapping
    const nameParts = (lead.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      event: 'lead_created',
      timestamp: new Date().toISOString(),
      source_system: 'UrbeGestion Real Estate AI Portal',
      contact: {
        firstName: firstName,
        lastName: lastName,
        name: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        source: `Web Portal - ${lead.source}`,
        tags: [
          'Inmobiliaria',
          'UrbeGestión',
          lead.operationInterest === 'venta_propietario' ? 'Propietario Captación' : 'Comprador/Arrendatario',
          lead.source
        ],
        customFields: {
          lead_id: lead.id,
          property_interest: lead.propertyTitle || 'General',
          property_id: lead.propertyInterestId || '',
          operation_type: lead.operationInterest,
          budget_amount: lead.budgetAmount || 0,
          budget_currency: lead.budgetCurrency || 'UF',
          mortgage_status: lead.mortgageStatus || 'no_especificado',
          target_move_date: lead.targetMoveDate || 'no_especificado',
          status: lead.status,
          appointment_date: lead.appointmentDate || '',
          appointment_time: lead.appointmentTime || '',
          notes: (lead.notes || []).join(' | '),
          attachments_count: lead.attachments?.length || 0,
          attachments_urls: lead.attachments || [],
          property_specs: lead.propertySpecs || null,
        }
      }
    };

    try {
      const response = await fetch('/api/lead-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const nowStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('urbe_ghl_last_dispatch', nowStr);
      localStorage.setItem('urbe_ghl_last_status', response.ok ? 'success' : 'error');

      return response.ok
        ? { success: true, message: `Lead sincronizado con GoHighLevel exitosamente (${nowStr}).` }
        : { success: false, message: response.status === 503 ? 'El webhook no está configurado en el servidor (GHL_WEBHOOK_URL).' : response.status === 404 ? 'El servidor de envío no está disponible (en local usa vercel dev; en producción, revisa el despliegue).' : `El servidor respondió con error ${response.status}.` };
    } catch (err) {
      console.warn('[WebhookService] No se pudo contactar /api/lead-webhook:', err);
      localStorage.setItem('urbe_ghl_last_status', 'error');
      return { success: false, message: 'No se pudo contactar el servidor de envío de leads.' };
    }
  }

  /**
   * Test connection with a sample lead
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    const sampleLead: Lead = {
      id: `test-${Date.now()}`,
      fullName: 'Prospecto Prueba GoHighLevel',
      email: 'prueba.ghl@urbegestion.cl',
      phone: '+56 9 9876 5432',
      propertyTitle: 'Penthouse Dúplex Vitacura (28.500 UF)',
      operationInterest: 'compra',
      budgetAmount: 28500,
      budgetCurrency: 'UF',
      status: 'nuevo',
      source: 'formulario_contacto',
      notes: ['Lead de prueba para verificar integración con GoHighLevel y disparadores de automatización.'],
      createdAt: new Date().toISOString().split('T')[0]
    };

    return this.dispatchLeadToGHL(sampleLead);
  }
}

export const webhookService = WebhookService.getInstance();
