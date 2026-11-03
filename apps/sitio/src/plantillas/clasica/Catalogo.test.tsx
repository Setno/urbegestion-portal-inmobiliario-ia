// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { Catalogo } from './Catalogo';

const propiedad = (id: string, extra: Partial<PublicProperty> = {}): PublicProperty => ({
  id,
  title: `Propiedad ${id}`,
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 1000,
  priceCurrency: 'UF',
  commune: 'Providencia',
  address: '',
  bedrooms: 2,
  bathrooms: 1,
  builtAreaM2: 80,
  totalAreaM2: 0,
  parkingSpots: 0,
  storageUnits: 0,
  expensesMonthlyClp: 0,
  mapQuery: '',
  featured: false,
  images: [],
  description: '',
  features: [],
  ...extra,
});

const lista = [
  propiedad('A', { operation: 'venta', commune: 'Providencia' }),
  propiedad('B', { operation: 'arriendo', commune: 'Ñuñoa', featured: true }),
];

describe('catálogo del sitio', () => {
  afterEach(cleanup);

  it('muestra primero las destacadas', () => {
    render(<Catalogo propiedades={lista} marketId="cl" conBuscador contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Propiedad B', 'Propiedad A']);
  });

  it('filtra al elegir una operación y permite limpiar el filtro aunque haya resultados', () => {
    render(<Catalogo propiedades={lista} marketId="cl" conBuscador contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    fireEvent.change(screen.getByLabelText('Operación'), { target: { value: 'arriendo' } });
    expect(screen.queryByText('Propiedad A')).toBeNull();
    expect(screen.getByText('Propiedad B')).toBeTruthy();
    expect(screen.getByText('1 propiedad')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Propiedad A')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Buscar'));
  });

  it('ofrece solo las comunas que tienen propiedades', () => {
    render(<Catalogo propiedades={lista} marketId="cl" conBuscador contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    const opciones = Array.from(screen.getByLabelText('Comuna').querySelectorAll('option')).map((o) => o.textContent);
    expect(opciones).toEqual(['Todas', 'Ñuñoa', 'Providencia']);
  });

  it('si nada coincide lo dice y deja volver a ver todo', () => {
    render(<Catalogo propiedades={lista} marketId="cl" conBuscador contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'no existe' } });
    expect(screen.getByText('Ninguna propiedad coincide con tu búsqueda.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('Propiedad A')).toBeTruthy();
  });

  it('la operación y el tipo siguen disponibles para lectores de pantalla', () => {
    render(<Catalogo propiedades={[lista[0]]} marketId="cl" conBuscador={false} contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    for (const texto of ['En Venta', 'Casa']) {
      expect(screen.getByText(texto).closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  it('la corredora puede apagar el buscador', () => {
    render(<Catalogo propiedades={lista} marketId="cl" conBuscador={false} contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    expect(screen.queryByLabelText('Buscar')).toBeNull();
    expect(screen.getByText('Propiedad A')).toBeTruthy();
  });

  it('el botón de consulta nombra la propiedad y solo aparece si hay WhatsApp', () => {
    const { unmount } = render(<Catalogo propiedades={[lista[0]]} marketId="cl" conBuscador contacto={{ whatsapp: '56911112222', whatsappMessage: '' }} />);
    const enlace = screen.getByRole('link', { name: 'Consultar por WhatsApp: Propiedad A' }).getAttribute('href') ?? '';
    expect(enlace).toContain('https://wa.me/56911112222?text=');
    expect(decodeURIComponent(enlace)).toContain('Propiedad A');
    unmount();
    render(<Catalogo propiedades={[lista[0]]} marketId="cl" conBuscador contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    expect(screen.queryByRole('link', { name: /Consultar por WhatsApp/ })).toBeNull();
  });
});
