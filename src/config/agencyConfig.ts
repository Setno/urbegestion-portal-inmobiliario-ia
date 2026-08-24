import { ALL_RM_COMMUNES } from '../data/chileanLocations';

export interface RealEstateBrandConfig {
  brandName: string;
  brokerName: string;
  brokerRole: string;
  tagline: string;
  experienceYears: number;
  cityRegion: string;
  logoUrl: string;
  logoWhiteUrl: string;
  brokerPhotoUrl: string;
  contact: {
    phone: string;
    phoneDisplay: string;
    whatsapp: string;
    whatsappMessage: string;
    email: string;
    address: string;
    schedule: string;
    instagram: string;
  };
  market: {
    defaultCurrency: 'UF' | 'CLP';
    ufValueClp: number;
    supportedComunas: string[];
    defaultMortgageRate: number;
    defaultDownPaymentPct: number;
    defaultYears: number;
  };
  aiAgent: {
    botName: string;
    welcomeMessage: string;
    avatarUrl: string;
    calendarUrl: string;
  };
  stats: {
    yearsExperience: string;
    propertiesSold: string;
    happyClients: string;
    averageDaysToSell: string;
  };
}

export const agencyConfig: RealEstateBrandConfig = {
  brandName: "UrbeGestión",
  brokerName: "Pilar Osorio",
  brokerRole: "Corredora de Propiedades Senior",
  tagline: "Más de 25 años de experiencia en propiedades agrícolas y urbanas en la Región Metropolitana de Chile",
  experienceYears: 25,
  cityRegion: "Santiago, Región Metropolitana, Chile",
  logoUrl: "https://www.urbegestion.cl/assets/images/urbe_main.png",
  logoWhiteUrl: "https://www.urbegestion.cl/assets/images/urbe_logo.png",
  brokerPhotoUrl: "https://www.urbegestion.cl/assets/images/sobremi.png",
  contact: {
    phone: "+56979094519",
    phoneDisplay: "+56 9 7909 4519",
    whatsapp: "56979094519",
    whatsappMessage: "Hola Pilar, me gustaría recibir más información sobre propiedades en UrbeGestión.",
    email: "posoriodaza@urbegestion.cl",
    address: "Región Metropolitana, Chile",
    schedule: "Lunes a Viernes: 8:00 - 21:00 hrs | Sábado: 9:00 - 14:00 hrs",
    instagram: "https://www.instagram.com/urbegestion/",
  },
  market: {
    defaultCurrency: 'UF',
    ufValueClp: 38650,
    supportedComunas: ALL_RM_COMMUNES,
    defaultMortgageRate: 4.85,
    defaultDownPaymentPct: 20,
    defaultYears: 25,
  },
  aiAgent: {
    botName: "UrbeBot Concierge",
    welcomeMessage: "¡Hola! Soy el Asistente Inmobiliario Inteligente de UrbeGestión. ¿Buscas comprar, arrendar o deseas tasar tu propiedad en la Región Metropolitana?",
    avatarUrl: "https://www.urbegestion.cl/assets/images/sobremi.png",
    calendarUrl: "https://calendly.com",
  },
  stats: {
    yearsExperience: "25+",
    propertiesSold: "480+",
    happyClients: "99%",
    averageDaysToSell: "42 días",
  },
};
