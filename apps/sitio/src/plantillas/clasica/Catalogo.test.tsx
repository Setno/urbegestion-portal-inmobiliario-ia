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

    const mover = (etiqueta: 'Precio mínimo' | 'Precio máximo', valor: number) =>
      fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: String(valor) } });
    const valorDe = (etiqueta: string) => (screen.getByLabelText(etiqueta) as HTMLInputElement).value;

    it('la banda de precio tiene dos manillas que van del precio más bajo al más alto, y muestra el rango elegido', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      const min = screen.getByLabelText('Precio mínimo') as HTMLInputElement;
      const max = screen.getByLabelText('Precio máximo') as HTMLInputElement;
      expect([min.type, max.type]).toEqual(['range', 'range']);
      expect([min.min, min.max, max.min, max.max]).toEqual(['2000', '12000', '2000', '12000']);
      expect([min.value, max.value]).toEqual(['2000', '12000']);
      expect(screen.getByText('2.000 UF – 12.000 UF')).toBeTruthy();
    });

    it('al mover la manilla del máximo deja fuera lo más caro, también las que están en pesos', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      mover('Precio máximo', 6000);
      expect(screen.getByText('Propiedad barata')).toBeTruthy();
      expect(screen.getByText('Propiedad pesos')).toBeTruthy(); // 5.000 UF
      expect(screen.queryByText('Propiedad cara')).toBeNull();
      expect(screen.getByText('2.000 UF – 6.000 UF')).toBeTruthy();
    });

    it('las manillas no se cruzan', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      mover('Precio mínimo', 8000);
      mover('Precio máximo', 3000);
      expect(valorDe('Precio máximo')).toBe('8000');
      mover('Precio máximo', 10000);
      mover('Precio mínimo', 11000);
      expect(valorDe('Precio mínimo')).toBe('10000');
    });

    it('con las manillas en los extremos no filtra nada', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      mover('Precio máximo', 6000);
      mover('Precio máximo', 12000);
      expect(screen.getByText('Propiedad cara')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).toBeNull();
    });

    it('al cambiar a pesos la banda se rehace en pesos y los precios se muestran en pesos, con el valor publicado al lado', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      mover('Precio máximo', 6000);
      fireEvent.change(screen.getByLabelText('Moneda'), { target: { value: 'CLP' } });
      expect((screen.getByLabelText('Precio mínimo') as HTMLInputElement).min).toBe('80000000');
      expect((screen.getByLabelText('Precio máximo') as HTMLInputElement).max).toBe('480000000');
      expect(valorDe('Precio máximo')).toBe('480000000'); // la banda vuelve a los extremos
      mover('Precio mínimo', 100_000_000);
      expect(screen.queryByText('Propiedad barata')).toBeNull(); // 80.000.000 CLP
      expect(screen.getByText(/≈ \$480\.000\.000 CLP/)).toBeTruthy();
      expect(screen.getByText(/12\.000 UF/, { selector: 'span.text-xs' })).toBeTruthy();
    });

    it('dice de dónde sale la UF y de qué día es', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      const nota = screen.getByText(/UF de hoy/);
      expect(nota.textContent).toContain('$40.000');
      expect(nota.textContent).toContain('Banco Central de Chile');
      expect(nota.textContent).toContain('04-11-2026');
    });

    it('sin la tasa de la UF y con precios en dos monedas no ofrece una banda que mentiría', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} />);
      expect(screen.queryByLabelText('Precio máximo')).toBeNull();
      expect(screen.queryByLabelText('Moneda')).toBeNull();
      expect(screen.queryByText(/UF de hoy/)).toBeNull();
    });

    it('limpiar filtros devuelve la banda a los extremos', () => {
      render(<Catalogo propiedades={precios} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      mover('Precio máximo', 3000);
      expect(screen.queryByText('Propiedad cara')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
      expect(screen.getByText('Propiedad cara')).toBeTruthy();
      expect(valorDe('Precio máximo')).toBe('12000');
    });

    it('con todo el catálogo al mismo precio no muestra una banda sin sentido', () => {
      render(<Catalogo propiedades={[propiedad('x'), propiedad('y')]} marketId="cl" conBuscador contacto={contacto} tasas={tasas} />);
      expect(screen.queryByLabelText('Precio máximo')).toBeNull();
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
