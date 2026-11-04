// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PublicProperty } from '@portal/sitio-datos/propiedades';
import { AsistenteChat } from './AsistenteChat';
import type { ContextoAsistente } from '../../lib/asistente';

const ctx: ContextoAsistente = {
  corredora: 'Casa Sur',
  corredor: 'Ana Soto',
  telefono: '+56 9 1111 2222',
  correo: 'hola@casasur.cl',
  marketId: 'cl',
  conTasacion: true,
};

const casa: PublicProperty = {
  id: 'p1',
  title: 'Casa con vista',
  operation: 'venta',
  propertyType: 'casa',
  priceAmount: 18500,
  priceCurrency: 'UF',
  commune: 'Vitacura',
  address: '',
  bedrooms: 3,
  bathrooms: 2,
  builtAreaM2: 120,
  totalAreaM2: 300,
  parkingSpots: 1,
  storageUnits: 0,
  expensesMonthlyClp: 0,
  mapQuery: '',
  featured: false,
  images: [],
  description: '',
  features: [],
  reservada: false,
};

const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'Abrir asistente' }));
const preguntar = (texto: string) => {
  fireEvent.change(screen.getByPlaceholderText(/Pregúntale/), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
};

describe('asistente de chat del sitio', () => {
  afterEach(cleanup);

  it('en el HTML del servidor solo hay un botón cerrado: el chat no pesa ni estorba antes de usarlo', () => {
    const html = renderToStaticMarkup(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={vi.fn()} />);
    expect(html).toContain('Abrir asistente');
    expect(html).not.toContain('Pregúntale');
  });

  it('se abre con un saludo de la corredora y se puede cerrar', () => {
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={vi.fn()} />);
    abrir();
    expect(screen.getByText(/Casa Sur/, { selector: 'p' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar asistente' }));
    expect(screen.queryByPlaceholderText(/Pregúntale/)).toBeNull();
  });

  it('responde con propiedades del catálogo y cada una lleva a su ficha', () => {
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={vi.fn()} />);
    abrir();
    preguntar('busco una casa en Vitacura');
    const enlace = screen.getByRole('link', { name: /Casa con vista/ });
    expect(enlace.getAttribute('href')).toBe('/propiedades/p1');
    expect(screen.getByText('busco una casa en Vitacura')).toBeTruthy();
  });

  it('una sugerencia se envía como si la hubiera escrito', () => {
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={vi.fn()} />);
    abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Agendar visita' }));
    expect(screen.getByLabelText('Tu nombre completo')).toBeTruthy();
  });

  it('el formulario de contacto aparece solo cuando hace falta y envía los datos con la última consulta', async () => {
    const enviarContacto = vi.fn().mockResolvedValue({ ok: true });
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={enviarContacto} />);
    abrir();
    expect(screen.queryByLabelText('Tu nombre completo')).toBeNull();
    preguntar('quiero agendar una visita');
    fireEvent.change(screen.getByLabelText('Tu nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+56911112222' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mis datos' }));
    await screen.findByText(/Ana Soto te contactará/);
    expect(enviarContacto).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      telefono: '+56911112222',
      fecha: '',
      hora: '',
      consulta: 'quiero agendar una visita',
      sitioWeb: '',
    });
    expect(screen.queryByLabelText('Tu nombre completo')).toBeNull();
  });

  it('si un dato está malo lo dice y conserva lo escrito', async () => {
    const enviarContacto = vi.fn().mockResolvedValue({ ok: false, error: 'telefono' });
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={enviarContacto} />);
    abrir();
    preguntar('quiero agendar una visita');
    fireEvent.change(screen.getByLabelText('Tu nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mis datos' }));
    expect((await screen.findByRole('alert')).textContent).toContain('teléfono');
    expect((screen.getByLabelText('Tu nombre completo') as HTMLInputElement).value).toBe('Ana Pérez');
  });

  it('si falla la red, avisa y deja reintentar', async () => {
    const enviarContacto = vi.fn().mockRejectedValue(new Error('red'));
    render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={enviarContacto} />);
    abrir();
    preguntar('quiero agendar una visita');
    fireEvent.change(screen.getByLabelText('Tu nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+56911112222' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mis datos' }));
    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos enviar');
  });

  it('muestra el aviso de privacidad y un campo trampa oculto en el formulario', () => {
    const { container } = render(<AsistenteChat propiedades={[casa]} contexto={ctx} enviarContacto={vi.fn()} />);
    abrir();
    preguntar('quiero agendar una visita');
    expect(container.querySelector('[aria-hidden="true"] input[name="sitio-web"]')).not.toBeNull();
    expect(screen.getByText(/solo para responder esta consulta/)).toBeTruthy();
  });
});
