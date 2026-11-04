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
  reservada: false,
  ...extra,
});

const lista = [
  propiedad('A', { operation: 'venta', commune: 'Providencia' }),
  propiedad('B', { operation: 'arriendo', commune: 'Ñuñoa', featured: true }),
];

describe('catálogo del sitio', () => {
  afterEach(cleanup);

  it('una propiedad reservada lleva la etiqueta "Reservada" (H-048)', () => {
    render(<Catalogo propiedades={[propiedad('R', { reservada: true }), propiedad('L')]} marketId="cl" conBuscador={false} contacto={{ whatsapp: '', whatsappMessage: '' }} />);
    expect(screen.getAllByText('Reservada')).toHaveLength(1);
  });

  describe('precio (H-051)', () => {
    const contacto = { whatsapp: '', whatsappMessage: '' };
    const tasas = { rates: { UF: 40000 }, readings: [{ currency: 'UF', value: 40000, date: '2026-11-04', source: 'Banco Central de Chile, vía mindicador.cl' }] };
    const precios = [
      propiedad('barata', { priceAmount: 2000, priceCurrency: 'UF' }),
      propiedad('cara', { priceAmount: 12000, priceCurrency: 'UF' }),
      propiedad('pesos', { priceAmount: 200_000_000, priceCurrency: 'CLP' }),
    ];

    it('filtra por precio máximo en UF, con montos escritos a la chilena', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '6.000' } });
      expect(screen.getByText('Propiedad barata')).toBeTruthy();
      expect(screen.getByText('Propiedad pesos')).toBeTruthy(); // 5.000 UF
      expect(screen.queryByText('Propiedad cara')).toBeNull();
    });

    it('al cambiar a pesos filtra y muestra los precios en pesos, con el valor publicado al lado', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      fireEvent.change(screen.getByLabelText('Moneda'), { target: { value: 'CLP' } });
      fireEvent.change(screen.getByLabelText('Precio mínimo'), { target: { value: '100.000.000' } });
      expect(screen.queryByText('Propiedad barata')).toBeNull(); // 80.000.000 CLP
      expect(screen.getByText(/≈ \$480\.000\.000 CLP/)).toBeTruthy();
      expect(screen.getByText(/12\.000 UF/)).toBeTruthy();
    });

    it('dice de dónde sale la UF y de qué día es', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      const nota = screen.getByText(/UF de hoy/);
      expect(nota.textContent).toContain('$40.000');
      expect(nota.textContent).toContain('Banco Central de Chile');
      expect(nota.textContent).toContain('04-11-2026');
    });

    it('sin la tasa de la UF y con precios en dos monedas no ofrece un filtro que mentiría', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} />);
      expect(screen.queryByLabelText('Precio máximo')).toBeNull();
      expect(screen.queryByLabelText('Moneda')).toBeNull();
      expect(screen.queryByText(/UF de hoy/)).toBeNull();
    });

    it('limpiar filtros también borra el precio', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      fireEvent.change(screen.getByLabelText('Precio máximo'), { target: { value: '3000' } });
      expect(screen.queryByText('Propiedad cara')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
      expect(screen.getByText('Propiedad cara')).toBeTruthy();
      expect((screen.getByLabelText('Precio máximo') as HTMLInputElement).value).toBe('');
    });
  });

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
