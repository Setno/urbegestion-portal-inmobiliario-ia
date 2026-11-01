import { describe, it, expect } from 'vitest';
import { toCsv, leadsToCsv, notesToCsv, propertiesToCsv, buildFullExportJson, exportFileName } from './dataExport';
import type { Lead } from '../../modules/crm/types/lead';
import { initialProperties } from '../../modules/catalogo/data/initialProperties';

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'l1',
  fullName: 'Ana Pérez',
  email: 'ana@ejemplo.cl',
  phone: '+56911112222',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
  createdAt: '2026-11-01T10:00:00.000Z',
  ...over,
});

const sinBom = (csv: string) => csv.replace(/^\uFEFF/, '');

describe('toCsv', () => {
  it('empieza con BOM, separa con punto y coma y termina cada fila con salto de línea', () => {
    const csv = toCsv(['A', 'B'], [['1', '2']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(sinBom(csv)).toBe('A;B\r\n1;2');
  });

  it('entrecomilla y escapa los valores con punto y coma, comillas o saltos de línea', () => {
    const csv = sinBom(toCsv(['X'], [['a;b'], ['dice "hola"'], ['linea1\nlinea2']]));
    expect(csv).toBe('X\r\n"a;b"\r\n"dice ""hola"""\r\n"linea1\nlinea2"');
  });

  it('neutraliza textos que Excel interpretaría como fórmula', () => {
    const csv = sinBom(toCsv(['X'], [['=HYPERLINK("http://malo")'], ['+56911112222'], ['@cmd'], ['-5 UF']]));
    const filas = csv.split('\r\n').slice(1);
    for (const f of filas) expect(f.replace(/^"/, '').startsWith("'")).toBe(true);
  });

  it('deja los números y booleanos tal cual y los vacíos en blanco', () => {
    expect(sinBom(toCsv(['N', 'B', 'V', 'U'], [[-3, true, undefined, null]]))).toBe('N;B;V;U\r\n-3;true;;');
  });
});

describe('leadsToCsv', () => {
  it('incluye una fila por lead con sus datos y el aviso de privacidad', () => {
    const csv = sinBom(
      leadsToCsv([lead({ privacyNotice: { shownAt: '2026-11-01T09:59:00.000Z', version: 'v1', purpose: 'contacto' } })]),
    );
    const [cabecera, fila] = csv.split('\r\n');
    expect(cabecera).toContain('Nombre');
    expect(cabecera).toContain('Aviso de privacidad (versión)');
    expect(fila).toContain('Ana Pérez');
    expect(fila).toContain('v1');
  });

  it('con una lista vacía solo trae la cabecera', () => {
    expect(sinBom(leadsToCsv([])).split('\r\n')).toHaveLength(1);
  });
});

describe('notesToCsv', () => {
  it('genera una fila por nota con el nombre del contacto', () => {
    const csv = sinBom(notesToCsv([lead({ notes: ['Llamar mañana', 'Pidió fotos'] }), lead({ id: 'l2', notes: [] })]));
    const filas = csv.split('\r\n');
    expect(filas).toHaveLength(3);
    expect(filas[1]).toContain('Llamar mañana');
    expect(filas[2]).toContain('Pidió fotos');
    expect(filas[1]).toContain('Ana Pérez');
  });
});

describe('propertiesToCsv', () => {
  it('trae una fila por propiedad, con estado de publicación y sin las imágenes embebidas', () => {
    const csv = sinBom(propertiesToCsv(initialProperties));
    const filas = csv.split('\r\n');
    expect(filas).toHaveLength(initialProperties.length + 1);
    expect(filas[0]).toContain('Estado de publicación');
    expect(csv).not.toContain('data:image');
  });

  it('una propiedad sin estado de publicación se exporta como publicada', () => {
    const p = { ...initialProperties[0], publicationStatus: undefined };
    expect(propertiesToCsv([p])).toContain('publicada');
  });
});

describe('buildFullExportJson', () => {
  it('junta leads y propiedades con la fecha de exportación', () => {
    const json = JSON.parse(buildFullExportJson({ leads: [lead()], properties: initialProperties.slice(0, 2), now: new Date('2026-11-01T12:00:00Z') }));
    expect(json.exportedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(json.leads).toHaveLength(1);
    expect(json.properties).toHaveLength(2);
  });
});

describe('exportFileName', () => {
  it('arma el nombre con el tipo y la fecha', () => {
    expect(exportFileName('leads', 'csv', new Date('2026-11-01T12:00:00Z'))).toBe('urbegestion_leads_2026-11-01.csv');
  });
});
