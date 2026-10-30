export type LeadStatus = 
  | 'nuevo' 
  | 'contactado' 
  | 'visita_agendada' 
  | 'en_negociacion' 
  | 'cerrado' 
  | 'descartado';

export type LeadSource = 
  | 'asistente_ia' 
  | 'ficha_propiedad' 
  | 'formulario_contacto' 
  | 'captacion_propietarios';

export interface LeadAttachment {
  id: string;
  name: string;
  url: string; // Base64 or Blob URL
  type: 'image' | 'video' | 'document';
  size?: string;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  propertyInterestId?: string;
  propertyTitle?: string;
  operationInterest: 'compra' | 'arriendo' | 'venta_propietario' | 'otro';
  budgetAmount?: number;
  budgetCurrency?: 'UF' | 'CLP';
  mortgageStatus?: 'al_contado' | 'pre_aprobado' | 'en_tramite' | 'sin_evaluar';
  targetMoveDate?: 'inmediato' | '1_a_3_meses' | 'mas_de_3_meses';
  status: LeadStatus;
  appointmentDate?: string;
  appointmentTime?: string;
  notes: string[];
  source: LeadSource;
  attachments?: string[]; // URLs or Base64 images/docs
  propertySpecs?: {
    operation?: 'venta' | 'arriendo';
    propertyType?: string;
    commune?: string;
    areaM2?: string;
    bedrooms?: string;
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedProperties?: string[]; // IDs de propiedades recomendadas
  actionRequired?: 'select_date' | 'provide_contact' | 'view_properties';
}
