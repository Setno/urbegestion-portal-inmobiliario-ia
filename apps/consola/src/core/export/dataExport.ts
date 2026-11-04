import type { Lead } from '../../modules/crm/types/lead';
import type { Property } from '../../modules/catalogo/types/property';
import { realEmail } from '../../modules/crm/services/leadEmail';

type Cell = string | number | boolean | null | undefined;

// Excel interpreta como fórmula un texto que empieza con estos caracteres; se les antepone un apóstrofe.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value: Cell): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// CSV pensado para Excel en español: BOM para las tildes y punto y coma como separador.
export const toCsv = (headers: string[], rows: Cell[][]): string =>
  '﻿' + [headers.map(cell), ...rows.map((r) => r.map(cell))].map((r) => r.join(';')).join('\r\n');

export const leadsToCsv = (leads: Lead[]): string =>
  toCsv(
    [
      'ID', 'Nombre', 'Email', 'Teléfono', 'Propiedad de interés', 'Operación', 'Estado', 'Origen',
      'Presupuesto', 'Moneda', 'Fecha de visita', 'Hora de visita', 'Cantidad de notas',
      'Propiedad creada desde el lead', 'Aviso de privacidad (versión)', 'Aviso de privacidad (fecha)',
      'Aviso de privacidad (finalidad)', 'Fecha de registro',
    ],
    leads.map((l) => [
      l.id, l.fullName, realEmail(l.email), l.phone, l.propertyTitle, l.operationInterest, l.status, l.source,
      l.budgetAmount, l.budgetCurrency, l.appointmentDate, l.appointmentTime, l.notes.length,
      l.convertedPropertyId, l.privacyNotice?.version, l.privacyNotice?.shownAt, l.privacyNotice?.purpose,
      l.createdAt,
    ]),
  );

export const notesToCsv = (leads: Lead[]): string =>
  toCsv(
    ['ID del contacto', 'Contacto', 'N° de nota', 'Nota'],
    leads.flatMap((l) => l.notes.map((n, i) => [l.id, l.fullName, i + 1, n])),
  );

export const propertiesToCsv = (properties: Property[]): string =>
  toCsv(
    [
      'ID', 'Título', 'Operación', 'Tipo', 'Precio', 'Moneda', 'Comuna', 'Dirección', 'Dormitorios', 'Baños',
      'M² construidos', 'M² totales', 'Estacionamientos', 'Bodegas', 'Destacada', 'Disponibilidad',
      'Estado de publicación', 'Motivo de rechazo', 'Fecha de aprobación', 'Cantidad de fotos', 'Descripción',
      'Características', 'Fecha de registro',
    ],
    properties.map((p) => [
      p.id, p.title, p.operation, p.propertyType, p.priceAmount, p.priceCurrency, p.commune, p.address, p.bedrooms, p.bathrooms,
      p.builtAreaM2, p.totalAreaM2, p.parkingSpots, p.storageUnits, p.featured, p.status,
      p.publicationStatus ?? 'publicada', p.rejectionReason, p.approvedAt, p.images.length, p.description,
      p.features.join(', '), p.createdAt,
    ]),
  );

// Copia completa y legible por máquina. Las fotos ya subidas viajan como enlaces; las antiguas en base64 se omiten por tamaño.
export const buildFullExportJson = ({ leads, properties, now = new Date() }: { leads: Lead[]; properties: Property[]; now?: Date }): string =>
  JSON.stringify(
    {
      exportedAt: now.toISOString(),
      leads: leads.map((l) => ({
        ...l,
        attachments: l.attachments?.filter((a) => !a.startsWith('data:')),
      })),
      properties: properties.map((p) => ({ ...p, images: p.images.filter((i) => !i.startsWith('data:')) })),
    },
    null,
    2,
  );

export const exportFileName = (kind: string, ext: 'csv' | 'json', now = new Date()): string =>
  `corredora_${kind}_${now.toISOString().slice(0, 10)}.${ext}`;

export const downloadFile = (name: string, content: string, mime: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
