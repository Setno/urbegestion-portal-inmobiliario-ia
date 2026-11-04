// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormularioTasacion } from './FormularioTasacion';

const llenar = () => {
  fireEvent.change(screen.getByLabelText('Comuna'), { target: { value: 'Lo Barnechea' } });
  fireEvent.change(screen.getByLabelText('Superficie (m²)'), { target: { value: '150' } });
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+56911112222' } });
};
const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Solicitar tasación' }));

describe('formulario de tasación para propietarios', () => {
  afterEach(cleanup);

  it('en el HTML del servidor el botón espera a que la página esté lista', () => {
    const html = renderToStaticMarkup(<FormularioTasacion enviarTasacion={vi.fn()} />);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });

  it('envía los datos del inmueble y del propietario y confirma con su teléfono', async () => {
    const enviarTasacion = vi.fn().mockResolvedValue({ ok: true });
    render(<FormularioTasacion enviarTasacion={enviarTasacion} />);
    await screen.findByRole('button', { name: 'Solicitar tasación' });
    fireEvent.change(screen.getByLabelText('¿Qué quieres hacer?'), { target: { value: 'arriendo' } });
    fireEvent.change(screen.getByLabelText('Tipo de propiedad'), { target: { value: 'departamento' } });
    fireEvent.change(screen.getByLabelText('Dormitorios'), { target: { value: '2' } });
    llenar();
    enviar();
    await screen.findByText(/te contactará al \+56911112222/);
    expect(enviarTasacion).toHaveBeenCalledWith({
      operacion: 'arriendo',
      tipo: 'departamento',
      comuna: 'Lo Barnechea',
      superficieM2: '150',
      dormitorios: '2',
      nombre: 'Ana Pérez',
      telefono: '+56911112222',
      correo: '',
      sitioWeb: '',
    });
    expect(document.activeElement).toBe(screen.getByRole('status'));
  });

  it('si un dato está malo lo dice, conserva lo escrito y deja corregir', async () => {
    const enviarTasacion = vi.fn().mockResolvedValueOnce({ ok: false, error: 'telefono' }).mockResolvedValueOnce({ ok: true });
    render(<FormularioTasacion enviarTasacion={enviarTasacion} />);
    await screen.findByRole('button', { name: 'Solicitar tasación' });
    llenar();
    enviar();
    expect((await screen.findByRole('alert')).textContent).toContain('teléfono');
    expect((screen.getByLabelText('Nombre completo') as HTMLInputElement).value).toBe('Ana Pérez');
    enviar();
    await screen.findByText(/te contactará/);
  });

  it('si el envío falla por red, avisa y deja reintentar', async () => {
    const enviarTasacion = vi.fn().mockRejectedValue(new Error('red'));
    render(<FormularioTasacion enviarTasacion={enviarTasacion} />);
    await screen.findByRole('button', { name: 'Solicitar tasación' });
    llenar();
    enviar();
    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos enviar');
  });

  it('muestra el aviso de privacidad y un campo trampa oculto', () => {
    const { container } = render(<FormularioTasacion enviarTasacion={vi.fn()} />);
    expect(container.querySelector('[aria-hidden="true"] input[name="sitio-web"]')).not.toBeNull();
    expect(screen.getByText(/solo para responder esta consulta/)).toBeTruthy();
  });
});
