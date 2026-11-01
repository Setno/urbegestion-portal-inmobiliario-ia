import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SearchFilterBar } from './SearchFilterBar';
import { PropertyGrid } from './PropertyGrid';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useMarketStore } from '../../../core/market/useMarketStore';
import { initialProperties } from '../data/initialProperties';
import type { Property } from '../types/property';

// Los títulos de las propiedades de ejemplo, por nombre corto
const T = {
  penthouse: initialProperties[0].title, // venta, 18.500 UF, 4 dorm, destacada
  casaDehesa: initialProperties[1].title, // venta, 24.900 UF, 5 dorm, Lo Barnechea
  deptoGolf: initialProperties[2].title, // arriendo, 45 UF, 2 dorm
  parcela: initialProperties[3].title, // venta, 8.900 UF, Melipilla
  providencia: initialProperties[5].title, // arriendo, 32 UF, 3 dorm
  oficina: initialProperties[7].title, // arriendo, 65 UF, 0 dorm
};

const visible = (title: string) => screen.queryAllByAltText(title).length > 0;
const contador = () => screen.getByText(/^\d+ propiedad(es)?$/).textContent;

const mostrarFiltros = () => fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));

const pantalla = () =>
  render(
    <>
      <SearchFilterBar />
      <PropertyGrid onOpenDetails={vi.fn()} onOpenBooking={vi.fn()} />
    </>,
  );

describe('Catálogo: buscador y grilla', () => {
  beforeEach(() => {
    localStorage.clear();
    // El efecto de aparición de las tarjetas usa IntersectionObserver, que jsdom no trae
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    usePropertyStore.setState({ properties: [...initialProperties], loading: false, currency: 'UF' });
    usePropertyStore.getState().resetFilters();
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [] });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('muestra las 8 propiedades de ejemplo y el contador', () => {
    pantalla();
    expect(contador()).toBe('8 propiedades');
    for (const p of initialProperties) expect(visible(p.title)).toBe(true);
  });

  it('no muestra las propiedades que no están publicadas (borrador, en revisión, rechazada)', () => {
    const estados: Property['publicationStatus'][] = ['borrador', 'en_revision', 'rechazada'];
    usePropertyStore.setState({
      properties: initialProperties.map((p, i) => (i < 3 ? { ...p, publicationStatus: estados[i] } : p)),
    });
    pantalla();
    expect(contador()).toBe('5 propiedades');
    expect(visible(T.penthouse)).toBe(false);
    expect(visible(T.casaDehesa)).toBe(false);
    expect(visible(T.deptoGolf)).toBe(false);
    expect(visible(T.parcela)).toBe(true);
  });

  describe('filtros', () => {
    it('la pestaña En Arriendo deja solo los arriendos', () => {
      pantalla();
      fireEvent.click(screen.getByRole('button', { name: 'En Arriendo' }));
      expect(contador()).toBe('3 propiedades');
      expect(visible(T.deptoGolf)).toBe(true);
      expect(visible(T.penthouse)).toBe(false);
    });

    it('filtra por tipo de inmueble', () => {
      pantalla();
      fireEvent.change(screen.getByDisplayValue('Todos los tipos'), { target: { value: 'oficina_comercial' } });
      expect(contador()).toBe('1 propiedad');
      expect(visible(T.oficina)).toBe(true);
    });

    it('filtra por palabra clave en título, descripción o características', () => {
      pantalla();
      fireEvent.change(screen.getByPlaceholderText(/Derechos de agua/), { target: { value: 'derechos de agua' } });
      expect(visible(T.parcela)).toBe(true);
      expect(visible(T.penthouse)).toBe(false);
    });

    it('filtra por comuna exacta', () => {
      pantalla();
      fireEvent.change(screen.getByDisplayValue(/Todas las comunas/), { target: { value: 'Vitacura' } });
      expect(contador()).toBe('1 propiedad');
      expect(visible(T.penthouse)).toBe(true);
      expect(visible(T.casaDehesa)).toBe(false);
    });

    it('filtra por precio máximo y dormitorios mínimos desde Filtros', () => {
      pantalla();
      mostrarFiltros();
      fireEvent.change(screen.getByPlaceholderText(/Ej: 25000/), { target: { value: '100' } });
      expect(contador()).toBe('3 propiedades'); // solo los arriendos cuestan menos de 100 UF
      fireEvent.change(screen.getByDisplayValue('Cualquier número'), { target: { value: '3' } });
      expect(contador()).toBe('1 propiedad'); // y con 3+ dormitorios, solo la de Providencia
      expect(visible(T.providencia)).toBe(true);
    });

    it('Limpiar devuelve todos los filtros a su valor inicial', () => {
      pantalla();
      fireEvent.click(screen.getByRole('button', { name: 'En Arriendo' }));
      fireEvent.click(screen.getByRole('button', { name: /Limpiar/ }));
      expect(contador()).toBe('8 propiedades');
      expect(screen.queryByRole('button', { name: /Limpiar/ })).toBeNull();
    });

    it('con una comuna compuesta (La Dehesa) la grilla muestra lo mismo que cuenta el buscador', () => {
      pantalla();
      fireEvent.change(screen.getByDisplayValue(/Todas las comunas/), {
        target: { value: 'Lo Barnechea (La Dehesa / Los Trapenses)' },
      });
      expect(contador()).toBe('1 propiedad');
      expect(visible(T.casaDehesa)).toBe(true);
      expect(visible(T.penthouse)).toBe(false);
    });

    it('lo mismo ocurre con Chicureo, Melipilla y Pirque', () => {
      pantalla();
      const comuna = screen.getByDisplayValue(/Todas las comunas/);
      fireEvent.change(comuna, { target: { value: 'Colina (Chicureo / Chamisero)' } });
      expect(visible(initialProperties[6].title)).toBe(true);
      fireEvent.change(comuna, { target: { value: 'Melipilla' } });
      expect(visible(T.parcela)).toBe(true);
      fireEvent.change(comuna, { target: { value: 'Pirque' } });
      expect(visible(initialProperties[4].title)).toBe(true);
    });
  });

  describe('precios en distintas monedas', () => {
    const conPrecios = () =>
      usePropertyStore.setState({
        properties: [
          { ...initialProperties[0], id: 'a', title: 'Casa en UF', priceAmount: 5000, priceCurrency: 'UF' }, // 193.250.000 CLP
          { ...initialProperties[1], id: 'b', title: 'Casa en pesos', priceAmount: 100000000, priceCurrency: 'CLP' }, // 2.587 UF
          { ...initialProperties[2], id: 'c', title: 'Casa cara en UF', priceAmount: 9000, priceCurrency: 'UF' }, // 347.850.000 CLP
        ],
      });
    const orden = (a: string, b: string) =>
      !!(screen.getAllByAltText(a)[0].compareDocumentPosition(screen.getAllByAltText(b)[0]) & Node.DOCUMENT_POSITION_FOLLOWING);

    it('ordena por valor real aunque los precios estén cargados en monedas distintas', () => {
      conPrecios();
      pantalla();
      fireEvent.change(screen.getByDisplayValue('Destacadas primero'), { target: { value: 'priceAsc' } });
      expect(orden('Casa en pesos', 'Casa en UF')).toBe(true); // 100 millones < 193 millones
      expect(orden('Casa en UF', 'Casa cara en UF')).toBe(true);
    });

    it('viendo el catálogo en pesos, el precio máximo se interpreta en pesos', () => {
      conPrecios();
      usePropertyStore.setState({ currency: 'CLP' });
      pantalla();
      mostrarFiltros();
      fireEvent.change(screen.getByPlaceholderText(/Ej: 900000000/), { target: { value: '200000000' } });
      expect(visible('Casa en pesos')).toBe(true);
      expect(visible('Casa en UF')).toBe(true);
      expect(visible('Casa cara en UF')).toBe(false);
      expect(contador()).toBe('2 propiedades');
    });

    it('viendo el catálogo en UF, el precio máximo se interpreta en UF', () => {
      conPrecios();
      pantalla();
      mostrarFiltros();
      fireEvent.change(screen.getByPlaceholderText(/Ej: 25000/), { target: { value: '6000' } });
      expect(visible('Casa en pesos')).toBe(true); // 2.587 UF
      expect(visible('Casa en UF')).toBe(true);
      expect(visible('Casa cara en UF')).toBe(false);
    });
  });

  describe('mercado y zonas de la corredora', () => {
    const opcionesDeComuna = () =>
      Array.from(screen.getByDisplayValue(/Todas las comunas/).querySelectorAll('option')).map((o) => o.value);

    it('sin zonas elegidas el buscador ofrece las comunas de todo Chile', () => {
      pantalla();
      const opciones = opcionesDeComuna();
      expect(opciones).toContain('Punta Arenas');
      expect(opciones).toContain('Vitacura');
      expect(opciones).toHaveLength(346 + 1); // las comunas más "Todas las comunas"
      expect(screen.getByText(/Todas las comunas de Chile/)).toBeTruthy();
      expect(screen.getByText('Propiedades en Chile')).toBeTruthy();
    });

    it('con una región elegida ofrece solo sus comunas y el título nombra la región', () => {
      useMarketStore.setState({ serviceAreas: ['CL-VS'] });
      pantalla();
      const opciones = opcionesDeComuna();
      expect(opciones).toContain('Viña del Mar');
      expect(opciones).not.toContain('Vitacura');
      expect(screen.getByText('Propiedades en Valparaíso')).toBeTruthy();
      expect(screen.getByText(/Todas las comunas de Valparaíso/)).toBeTruthy();
    });

    it('una propiedad de otra región se encuentra por su comuna', () => {
      usePropertyStore.setState({
        properties: [{ ...initialProperties[0], id: 'v1', title: 'Casa frente al mar en Viña', commune: 'Viña del Mar' }],
      });
      pantalla();
      fireEvent.change(screen.getByDisplayValue(/Todas las comunas/), { target: { value: 'Viña del Mar' } });
      expect(visible('Casa frente al mar en Viña')).toBe(true);
      expect(contador()).toBe('1 propiedad');
    });
  });

  describe('orden', () => {
    const antes = (a: string, b: string) =>
      !!(screen.getAllByAltText(a)[0].compareDocumentPosition(screen.getAllByAltText(b)[0]) & Node.DOCUMENT_POSITION_FOLLOWING);

    it('por defecto pone primero las destacadas', () => {
      pantalla();
      expect(antes(T.penthouse, T.providencia)).toBe(true);
    });

    it('ordena de menor a mayor precio y de mayor a menor', () => {
      pantalla();
      const orden = screen.getByDisplayValue('Destacadas primero');
      fireEvent.change(orden, { target: { value: 'priceAsc' } });
      expect(antes(T.providencia, T.deptoGolf)).toBe(true);
      expect(antes(T.deptoGolf, T.casaDehesa)).toBe(true);
      fireEvent.change(orden, { target: { value: 'priceDesc' } });
      expect(antes(T.casaDehesa, T.penthouse)).toBe(true);
      expect(antes(T.penthouse, T.providencia)).toBe(true);
    });
  });

  describe('estados vacíos', () => {
    it('sin resultados ofrece restablecer los filtros y los restablece', () => {
      pantalla();
      fireEvent.change(screen.getByPlaceholderText(/Derechos de agua/), { target: { value: 'zzzz' } });
      expect(screen.getByText(/No se encontraron propiedades con estos filtros/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Restablecer todos los filtros/ }));
      expect(contador()).toBe('8 propiedades');
      expect(visible(T.penthouse)).toBe(true);
    });

    it('mientras carga desde la base muestra "Cargando propiedades…" y no el aviso de vacío', () => {
      usePropertyStore.setState({ properties: [], loading: true });
      pantalla();
      expect(screen.getByRole('status').textContent).toContain('Cargando propiedades');
      expect(screen.queryByText(/No se encontraron propiedades/)).toBeNull();
    });
  });
});
