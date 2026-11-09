// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormularioVisita } from './FormularioVisita';

const llenar = () => {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '+56911112222' } });
};
const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Solicitar visita' }));

describe('formulario de visita', () => {
  afterEach(cleanup);

  it('en el HTML del servidor el botón espera a que la página esté lista: un envío antes de tiempo perdería lo escrito', () => {
    const html = renderToStaticMarkup(<FormularioVisita propiedadId="p1" enviarVisita={vi.fn()} />);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
  });

  it('envía los datos y confirma con el teléfono que dejó la persona', async () => {
    const enviarVisita = vi.fn().mockResolvedValue({ ok: true });
    render(<FormularioVisita propiedadId="p1" enviarVisita={enviarVisita} />);
    llenar();
    fireEvent.change(screen.getByLabelText('Correo (opcional)'), { target: { value: 'ana@correo.cl' } });
    fireEvent.change(screen.getByLabelText('Fecha preferida (opcional)'), { target: { value: '2030-01-15' } });
    enviar();
    await screen.findByText(/te contactará al \+56911112222/);
    expect(enviarVisita).toHaveBeenCalledWith('p1', {
      nombre: 'Ana Pérez',
      telefono: '+56911112222',
      correo: 'ana@correo.cl',
      fecha: '2030-01-15',
      hora: '',
      sitioWeb: '',
    });
    expect(screen.queryByRole('button', { name: 'Solicitar visita' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('status'));
  });

  it('H-067: muestra un ejemplo de teléfono y lo ordena al salir del campo', () => {
    render(<FormularioVisita propiedadId="p1" enviarVisita={vi.fn()} />);
    const campo = screen.getByLabelText('Teléfono') as HTMLInputElement;
    expect(campo.placeholder).toBe('+56 9 1234 5678');
    fireEvent.change(campo, { target: { value: '9 1111-2222' } });
    fireEvent.blur(campo);
    expect(campo.value).toBe('+56 9 1111 2222');
    fireEvent.change(campo, { target: { value: '12ab' } });
    fireEvent.blur(campo);
    expect(campo.value).toBe('12ab'); // lo que no es un número se deja para que la persona lo corrija
  });

  it('si el dato está malo lo dice, conserva lo escrito y deja corregir', async () => {
    const enviarVisita = vi.fn().mockResolvedValueOnce({ ok: false, error: 'telefono' }).mockResolvedValueOnce({ ok: true });
    render(<FormularioVisita propiedadId="p1" enviarVisita={enviarVisita} />);
    llenar();
    enviar();
    expect((await screen.findByRole('alert')).textContent).toContain('teléfono');
    expect((screen.getByLabelText('Nombre completo') as HTMLInputElement).value).toBe('Ana Pérez');
    enviar();
    await screen.findByText(/te contactará/);
  });

  it('si falla la conexión avisa para no perder el contacto', async () => {
    const enviarVisita = vi.fn().mockRejectedValue(new Error('sin red'));
    render(<FormularioVisita propiedadId="p1" enviarVisita={enviarVisita} />);
    llenar();
    enviar();
    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos enviar');
    expect(screen.getByRole('button', { name: 'Solicitar visita' })).toBeTruthy();
  });

  it('no permite un doble envío mientras espera la respuesta', async () => {
    let responder: (r: { ok: true }) => void = () => {};
    const enviarVisita = vi.fn(() => new Promise<{ ok: true }>((r) => { responder = r; }));
    render(<FormularioVisita propiedadId="p1" enviarVisita={enviarVisita} />);
    llenar();
    enviar();
    const boton = await screen.findByRole('button', { name: 'Enviando…' });
    expect((boton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(boton.closest('form') as HTMLFormElement);
    expect(enviarVisita).toHaveBeenCalledTimes(1);
    responder({ ok: true });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Enviando…' })).toBeNull());
  });

  it('el campo trampa queda fuera de la vista y del teclado', () => {
    render(<FormularioVisita propiedadId="p1" enviarVisita={vi.fn()} />);
    const trampa = document.querySelector('input[name="sitio-web"]') as HTMLInputElement;
    expect(trampa.tabIndex).toBe(-1);
    const contenedor = trampa.closest('[aria-hidden="true"]');
    expect(contenedor).toBeTruthy();
    expect(contenedor?.classList.contains('hidden')).toBe(true);
  });
});
