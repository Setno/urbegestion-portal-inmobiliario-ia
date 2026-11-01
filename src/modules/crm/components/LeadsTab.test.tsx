import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { LeadsTab } from './LeadsTab';
import { useLeadStore } from '../stores/useLeadStore';
import { usePropertyStore } from '../../catalogo/stores/usePropertyStore';
import { initialProperties } from '../../catalogo/data/initialProperties';
import type { Lead } from '../types/lead';

const hoy = new Date().toISOString().slice(0, 10);

const lead = (over: Partial<Lead>): Lead => ({
  id: 'x',
  fullName: 'Sin Nombre',
  email: 'x@ejemplo.cl',
  phone: '+56 9 0000 0000',
  operationInterest: 'compra',
  status: 'nuevo',
  notes: [],
  source: 'formulario_contacto',
  createdAt: '2026-01-01',
  ...over,
});

const ana = lead({ id: 'a', fullName: 'Ana Rojas', email: 'ana@ejemplo.cl', phone: '+56 9 1111 2222', status: 'nuevo', notes: ['Prefiere llamar en la tarde'] });
const beto = lead({
  id: 'b', fullName: 'Beto Soto', status: 'contactado', appointmentDate: '2026-12-05', appointmentTime: '11:00',
  propertyTitle: 'Casa en Vitacura',
});
const carla = lead({ id: 'c', fullName: 'Carla Díaz', status: 'cerrado', attachments: ['https://ejemplo.cl/foto1.jpg'], createdAt: hoy });
const propietario = lead({
  id: 'p', fullName: 'Pedro Dueño', operationInterest: 'venta_propietario', source: 'captacion_propietarios',
  propertySpecs: { operation: 'venta', propertyType: 'casa', commune: 'Ñuñoa', areaM2: '120', bedrooms: '3' },
});

const abrirTabla = () => fireEvent.click(screen.getByRole('button', { name: /Tabla Lista/ }));
const filas = () => screen.getAllByRole('row').slice(1); // sin la cabecera

describe('LeadsTab (CRM)', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeadStore.setState({ leads: [ana, beto, carla, propietario] });
    usePropertyStore.setState({ properties: [...initialProperties] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('vista Kanban', () => {
    it('muestra el total de leads y deja a cada uno en la columna de su estado', () => {
      render(<LeadsTab />);
      expect(screen.getByText('4 de 4 leads')).toBeTruthy();
      const columna = (titulo: string) => screen.getByText(titulo).closest('div')!.parentElement!;
      expect(within(columna('Nuevos Prospectos')).getByText('Ana Rojas')).toBeTruthy();
      expect(within(columna('En Calificación')).getByText('Beto Soto')).toBeTruthy();
      expect(within(columna('Cierre Ganado')).getByText('Carla Díaz')).toBeTruthy();
    });

    it('cambiar el estado desde la tarjeta mueve el lead en la tienda', () => {
      render(<LeadsTab />);
      const tarjeta = screen.getAllByText('Ana Rojas')[0].closest('.cursor-pointer') as HTMLElement;
      fireEvent.change(within(tarjeta).getByRole('combobox'), { target: { value: 'en_negociacion' } });
      expect(useLeadStore.getState().leads.find((l) => l.id === 'a')?.status).toBe('en_negociacion');
    });
  });

  describe('vista Tabla', () => {
    it('lista una fila por lead con su contacto y el enlace a WhatsApp', () => {
      render(<LeadsTab />);
      abrirTabla();
      expect(filas()).toHaveLength(4);
      const enlace = screen.getByRole('link', { name: /\+56 9 1111 2222/ }) as HTMLAnchorElement;
      expect(enlace.href).toBe('https://wa.me/56911112222');
    });

    it('cambiar el estado en la tabla actualiza el lead', () => {
      render(<LeadsTab />);
      abrirTabla();
      const fila = filas().find((f) => within(f).queryByText('Beto Soto'))!;
      fireEvent.change(within(fila).getByRole('combobox'), { target: { value: 'visita_agendada' } });
      expect(useLeadStore.getState().leads.find((l) => l.id === 'b')?.status).toBe('visita_agendada');
    });
  });

  describe('búsqueda y filtros', () => {
    const buscar = (texto: string) =>
      fireEvent.change(screen.getByPlaceholderText(/Buscar por cliente/), { target: { value: texto } });

    it('busca por nombre, sin distinguir mayúsculas', () => {
      render(<LeadsTab />);
      abrirTabla();
      buscar('ANA ro');
      expect(filas()).toHaveLength(1);
      expect(screen.getByText('1 de 4 leads')).toBeTruthy();
    });

    it('busca dentro de las notas y por el título de la propiedad', () => {
      render(<LeadsTab />);
      abrirTabla();
      buscar('llamar en la tarde');
      expect(within(filas()[0]).getByText('Ana Rojas')).toBeTruthy();
      buscar('vitacura');
      expect(within(filas()[0]).getByText('Beto Soto')).toBeTruthy();
    });

    it('sin coincidencias muestra el aviso y se puede limpiar la búsqueda', () => {
      render(<LeadsTab />);
      abrirTabla();
      buscar('zzzz');
      expect(screen.getByText(/No se encontraron leads/)).toBeTruthy();
      fireEvent.click(screen.getByText('✕'));
      expect(filas()).toHaveLength(4);
    });

    it('el filtro Visitas deja solo los leads con visita agendada', () => {
      render(<LeadsTab />);
      abrirTabla();
      fireEvent.click(screen.getByRole('button', { name: /Visitas \(1\)/ }));
      expect(filas()).toHaveLength(1);
      expect(within(filas()[0]).getByText('Beto Soto')).toBeTruthy();
    });

    it('el filtro Con Fotos deja solo los leads con adjuntos', () => {
      render(<LeadsTab />);
      abrirTabla();
      fireEvent.click(screen.getByRole('button', { name: /Con Fotos \(1\)/ }));
      expect(filas()).toHaveLength(1);
      expect(within(filas()[0]).getByText('Carla Díaz')).toBeTruthy();
    });

    it('el filtro De Hoy deja los registrados hoy y Todos los devuelve', () => {
      render(<LeadsTab />);
      abrirTabla();
      fireEvent.click(screen.getByRole('button', { name: /De Hoy \(1\)/ }));
      expect(filas()).toHaveLength(1);
      expect(within(filas()[0]).getByText('Carla Díaz')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Todos \(4\)/ }));
      expect(filas()).toHaveLength(4);
    });

    it('el selector de propiedad filtra por el título elegido', () => {
      useLeadStore.setState({ leads: [ana, { ...beto, propertyTitle: initialProperties[0].title }] });
      render(<LeadsTab />);
      abrirTabla();
      fireEvent.change(screen.getByDisplayValue(/Todas las Propiedades/), { target: { value: initialProperties[0].title } });
      expect(filas()).toHaveLength(1);
      expect(within(filas()[0]).getByText('Beto Soto')).toBeTruthy();
    });
  });

  describe('ficha del lead', () => {
    const abrirFicha = (nombre: string) => {
      abrirTabla();
      const fila = filas().find((f) => within(f).queryByText(nombre))!;
      fireEvent.click(within(fila).getByRole('button', { name: 'Ver Ficha' }));
    };

    it('abre la ficha con los datos y las notas, y se cierra con Cerrar', () => {
      render(<LeadsTab />);
      abrirFicha('Ana Rojas');
      expect(screen.getByText('Bitácora / Historial de Notas')).toBeTruthy();
      expect(screen.getByText(/Prefiere llamar en la tarde/)).toBeTruthy();
      expect(screen.getByText('Sin archivos fotográficos adjuntos en este registro.')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
      expect(screen.queryByText('Bitácora / Historial de Notas')).toBeNull();
    });

    it('agrega una nota con el botón y la muestra en la bitácora', () => {
      render(<LeadsTab />);
      abrirFicha('Ana Rojas');
      const caja = screen.getByPlaceholderText('Añadir nota de seguimiento...') as HTMLInputElement;
      fireEvent.change(caja, { target: { value: 'Quedó de enviar documentos' } });
      fireEvent.click(screen.getByRole('button', { name: 'Añadir' }));
      expect(useLeadStore.getState().leads.find((l) => l.id === 'a')?.notes).toEqual([
        'Prefiere llamar en la tarde',
        'Quedó de enviar documentos',
      ]);
      expect(screen.getByText(/Quedó de enviar documentos/)).toBeTruthy();
      expect(caja.value).toBe('');
    });

    it('también agrega la nota con Enter, y una nota vacía no se agrega', () => {
      render(<LeadsTab />);
      abrirFicha('Ana Rojas');
      const caja = screen.getByPlaceholderText('Añadir nota de seguimiento...');
      fireEvent.change(caja, { target: { value: '   ' } });
      fireEvent.keyDown(caja, { key: 'Enter' });
      expect(useLeadStore.getState().leads.find((l) => l.id === 'a')?.notes).toHaveLength(1);
      fireEvent.change(caja, { target: { value: 'Nota con Enter' } });
      fireEvent.keyDown(caja, { key: 'Enter' });
      expect(useLeadStore.getState().leads.find((l) => l.id === 'a')?.notes).toContain('Nota con Enter');
    });

    it('Eliminar Lead lo borra de la tienda y cierra la ficha', () => {
      render(<LeadsTab />);
      abrirFicha('Beto Soto');
      fireEvent.click(screen.getByRole('button', { name: /Eliminar Lead/ }));
      expect(useLeadStore.getState().leads.map((l) => l.id)).toEqual(['a', 'c', 'p']);
      expect(screen.queryByText('Bitácora / Historial de Notas')).toBeNull();
    });

    it('muestra las fotos adjuntas y las amplía al hacer clic', () => {
      render(<LeadsTab />);
      abrirFicha('Carla Díaz');
      expect(screen.getByText(/Fotografías y Antecedentes Adjuntos \(1\)/)).toBeTruthy();
      expect(screen.getAllByAltText('Adjunto 1')).toHaveLength(1);
      fireEvent.click(screen.getByAltText('Adjunto 1'));
      expect(screen.getAllByRole('img').length).toBeGreaterThan(1);
    });
  });

  describe('propietario: crear propiedad en borrador', () => {
    it('crea la propiedad en borrador, la vincula al lead y cambia el botón por el aviso', () => {
      render(<LeadsTab />);
      abrirTabla();
      const fila = filas().find((f) => within(f).queryByText('Pedro Dueño'))!;
      fireEvent.click(within(fila).getByRole('button', { name: 'Ver Ficha' }));

      const antes = usePropertyStore.getState().properties.length;
      fireEvent.click(screen.getByRole('button', { name: 'Crear propiedad en borrador' }));

      const { properties } = usePropertyStore.getState();
      expect(properties).toHaveLength(antes + 1);
      const creada = properties[properties.length - 1] ?? properties[0];
      const lead = useLeadStore.getState().leads.find((l) => l.id === 'p')!;
      expect(properties.some((p) => p.id === lead.convertedPropertyId)).toBe(true);
      expect(properties.find((p) => p.id === lead.convertedPropertyId)?.publicationStatus ?? creada.publicationStatus).toBe('borrador');
      expect(screen.queryByRole('button', { name: 'Crear propiedad en borrador' })).toBeNull();
      expect(screen.getByText(/Ya hay una propiedad en borrador/)).toBeTruthy();
    });

    it('un lead que no es de propietario no ofrece crear propiedad', () => {
      useLeadStore.setState({ leads: [{ ...propietario, operationInterest: 'compra' }] });
      render(<LeadsTab />);
      abrirTabla();
      fireEvent.click(screen.getByRole('button', { name: 'Ver Ficha' }));
      expect(screen.queryByRole('button', { name: 'Crear propiedad en borrador' })).toBeNull();
    });
  });

  describe('exportación', () => {
    it('Exportar Excel descarga un CSV con los leads filtrados', () => {
      let descarga: { href: string | null; nombre: string | null } | null = null;
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        descarga = { href: this.getAttribute('href'), nombre: this.getAttribute('download') };
      });
      render(<LeadsTab />);
      fireEvent.change(screen.getByPlaceholderText(/Buscar por cliente/), { target: { value: 'Beto' } });
      fireEvent.click(screen.getByTitle('Exportar a Excel / CSV'));

      expect(descarga).not.toBeNull();
      const { href, nombre } = descarga!;
      expect(nombre).toBe(`leads_urbegestion_${hoy}.csv`);
      const csv = decodeURI(href!.replace('data:text/csv;charset=utf-8,', ''));
      const lineas = csv.split('\n');
      expect(lineas).toHaveLength(2);
      expect(lineas[0]).toContain('Nombre');
      expect(lineas[1]).toContain('Beto Soto');
      expect(csv).not.toContain('Ana Rojas');
    });
  });
});
