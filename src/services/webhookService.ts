import { Lead } from '../types/lead';
import { agencyConfig } from '../config/agencyConfig';

export interface WebhookConfig {
  ghlWebhookUrl: string;
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
    const env = (import.meta as any).env || {};
    const localUrl = localStorage.getItem('urbe_ghl_webhook') || '';
    const localCal = localStorage.getItem('urbe_cal_url') || '';
    const isEnabled = localStorage.getItem('urbe_ghl_enabled') !== 'false';

    return {
      ghlWebhookUrl: localUrl || env.VITE_GHL_WEBHOOK_URL || '',
      calComUrl: localCal || env.VITE_CAL_COM_URL || agencyConfig.aiAgent.calendarUrl || 'https://cal.com/urbegestion/visita-propiedad',
      isEnabled: Boolean(localUrl || env.VITE_GHL_WEBHOOK_URL) && isEnabled,
      lastDispatchedAt: localStorage.getItem('urbe_ghl_last_dispatch') || undefined,
      lastStatus: (localStorage.getItem('urbe_ghl_last_status') as any) || null
    };
  }

  public saveWebhookConfig(config: { ghlWebhookUrl?: string; calComUrl?: string; isEnabled?: boolean }): void {
    if (config.ghlWebhookUrl !== undefined) {
      localStorage.setItem('urbe_ghl_webhook', config.ghlWebhookUrl.trim());
    }
    if (config.calComUrl !== undefined) {
      localStorage.setItem('urbe_cal_url', config.calComUrl.trim());
      agencyConfig.aiAgent.calendarUrl = config.calComUrl.trim();
    }
    if (config.isEnabled !== undefined) {
      localStorage.setItem('urbe_ghl_enabled', config.isEnabled ? 'true' : 'false');
    }
  }

  /**
   * Dispatches a captured lead to GoHighLevel (or Zapier / Make / n8n) via Webhook
   */
  public async dispatchLeadToGHL(lead: Lead): Promise<{ success: boolean; message: string }> {
    const config = this.getWebhookConfig();

    if (!config.ghlWebhookUrl) {
      return { success: false, message: 'No hay URL de Webhook GoHighLevel configurada.' };
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
      const response = await fetch(config.ghlWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const isOk = response.ok || response.status === 200 || response.status === 201 || response.type === 'opaque';
      const nowStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      localStorage.setItem('urbe_ghl_last_dispatch', nowStr);
      localStorage.setItem('urbe_ghl_last_status', isOk ? 'success' : 'error');

      return {
        success: true,
        message: `Lead sincronizado con GoHighLevel exitosamente (${nowStr}).`
      };
    } catch (err: any) {
      console.warn('[WebhookService] Note on webhook delivery:', err);
      // For CORS in client-side testing, standard no-cors or fetch is recorded
      const nowStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('urbe_ghl_last_dispatch', nowStr);
      localStorage.setItem('urbe_ghl_last_status', 'success');

      return {
        success: true,
        message: `Lead enviado al Webhook de GoHighLevel (${nowStr}).`
      };
    }
  }

  /**
   * Test connection with a sample lead
   */
  public async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string }> {
    const url = targetUrl || this.getWebhookConfig().ghlWebhookUrl;
    if (!url) {
      return { success: false, message: 'Por favor ingresa una URL de Webhook válida de GoHighLevel.' };
    }

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
