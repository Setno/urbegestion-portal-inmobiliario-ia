import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

const { uploadOriginalIfRemote } = vi.hoisted(() => ({ uploadOriginalIfRemote: vi.fn() }));
vi.mock('../../../modules/catalogo/services/imageStorage', () => ({ uploadOriginalIfRemote }));

import { BrandingTab } from './BrandingTab';
import { useBrandStore } from '../../brand/useBrandStore';

const original = useBrandStore.getState();
const botonGuardar = () => screen.getByRole('button', { name: /Guardar y Aplicar$/ }) as HTMLButtonElement;
const subirLogo = () => {
  const entrada = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(entrada, { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } });
};

describe('BrandingTab con datos en la base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    useBrandStore.setState({ ...original, loadStatus: 'ok' }, true);
  });

  afterEach(() => {
    cleanup();
    useBrandStore.setState(original, true);
  });

  it('mientras no se leen los datos no muestra el formulario', () => {
    useBrandStore.setState({ loadStatus: 'idle' });
    render(<BrandingTab />);
    expect(screen.getByText(/Cargando los datos/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Guardar/ })).toBeNull();
  });

  it('si la lectura falló lo dice y permite reintentar, sin dejar editar', () => {
    const load = vi.fn().mockResolvedValue(undefined);
    useBrandStore.setState({ loadStatus: 'error', load });
    render(<BrandingTab />);
    expect(screen.queryByRole('button', { name: /Guardar/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('el formulario toma los datos reales apenas termina la lectura', () => {
    useBrandStore.setState({ loadStatus: 'idle' });
    render(<BrandingTab />);
    act(() => {
      useBrandStore.setState({ loadStatus: 'ok', config: { ...original.config, brandName: 'Casa Sur' } });
    });
    expect(screen.getByDisplayValue('Casa Sur')).toBeTruthy();
  });

  it('no deja guardar mientras se sube una imagen, y después usa la dirección subida', async () => {
    let terminar: (url: string) => void = () => undefined;
    uploadOriginalIfRemote.mockReturnValue(new Promise((resolve) => { terminar = resolve; }));
    render(<BrandingTab />);
    await act(async () => subirLogo());
    expect(botonGuardar().disabled).toBe(true);
    await act(async () => terminar('https://a.cl/logo.png'));
    expect(botonGuardar().disabled).toBe(false);
    expect(screen.getByDisplayValue('https://a.cl/logo.png')).toBeTruthy();
  });

  it('si la subida falla avisa y conserva el logo anterior', async () => {
    uploadOriginalIfRemote.mockRejectedValue(new Error('muy grande'));
    render(<BrandingTab />);
    await act(async () => subirLogo());
    expect(screen.getByRole('alert').textContent).toContain('No se pudo subir la imagen');
    expect(screen.getByDisplayValue(original.config.logoUrl)).toBeTruthy();
    expect(botonGuardar().disabled).toBe(false);
  });

  it('avisa si una dirección no es válida', async () => {
    useBrandStore.setState({ saveBrand: vi.fn().mockResolvedValue({ ok: false, error: 'enlace_invalido' }) });
    render(<BrandingTab />);
    await act(async () => {
      fireEvent.click(botonGuardar());
    });
    expect(screen.getByRole('alert').textContent).toContain('direcciones no es válida');
  });
});
