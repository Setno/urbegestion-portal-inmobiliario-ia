import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { OwnerValuation } from './OwnerValuation';
import { useLeadStore } from '../../crm/stores/useLeadStore';
import { registerLeadEvents } from '../../crm/services/leadEvents';

const siguiente = (texto: RegExp) => fireEvent.click(screen.getByRole('button', { name: texto }));
const atras = () => fireEvent.click(screen.getByRole('button', { name: /Atrás/ }));

const archivo = (nombre: string, tipo: string, bytes = 10) => {
  const f = new File(['x'.repeat(10)], nombre, { type: tipo });
  if (bytes !== 10) Object.defineProperty(f, 'size', { value: bytes });
  return f;
};
const subir = (...files: File[]) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

const hastaContacto = () => {
  siguiente(/Siguiente: Ubicación/);
  siguiente(/Siguiente: Fotos & Antecedentes/);
  siguiente(/Siguiente: Datos de Contacto/);
};

const llenarContacto = (nombre: string, telefono: string, correo = '') => {
  fireEvent.change(screen.getByPlaceholderText('Tu nombre y apellido'), { target: { value: nombre } });
  fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { value: telefono } });
  if (correo) fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: correo } });
};
const enviar = () => fireEvent.submit(screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!);

describe('OwnerValuation (valorizador para propietarios)', () => {
  let dejarDeEscuchar: () => void;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    useLeadStore.setState({ leads: [] });
    dejarDeEscuchar = registerLeadEvents();
  });

  afterEach(() => {
    dejarDeEscuchar();
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('cerrado no pinta nada', () => {
    const { container } = render(<OwnerValuation isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('el botón de cerrar del encabezado avisa al padre', () => {
    const cerrar = vi.fn();
    render(<OwnerValuation isOpen onClose={cerrar} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(cerrar).toHaveBeenCalled();
  });

  describe('pasos', () => {
    it('el título cambia al elegir arriendo', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      expect(screen.getByText('Vende con UrbeGestión')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Arrendar|Arriendo/ }));
      expect(screen.getByText('Pon en Arriendo tu Propiedad')).toBeTruthy();
    });

    it('avanza por los 4 pasos y se puede volver atrás conservando lo escrito', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      fireEvent.change(screen.getByPlaceholderText('Ej: 140'), { target: { value: '200' } });
      siguiente(/Siguiente: Fotos & Antecedentes/);
      expect(screen.getByText(/Haz clic para seleccionar fotos/)).toBeTruthy();
      siguiente(/Siguiente: Datos de Contacto/);
      expect(screen.getByPlaceholderText('Tu nombre y apellido')).toBeTruthy();
      atras();
      atras();
      expect((screen.getByPlaceholderText('Ej: 140') as HTMLInputElement).value).toBe('200');
    });
  });

  describe('fotos y antecedentes', () => {
    it('adjunta una imagen, la muestra y se puede quitar con Eliminar todos', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(archivo('living.jpg', 'image/jpeg'));
      await screen.findByText('Archivos adjuntados (1)');
      expect(screen.getByAltText('living.jpg')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar todos' }));
      expect(screen.queryByText(/Archivos adjuntados/)).toBeNull();
    });

    it('quita una foto con su botón', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(archivo('a.jpg', 'image/jpeg'), archivo('b.jpg', 'image/jpeg'));
      await screen.findByText('Archivos adjuntados (2)');
      fireEvent.click(screen.getAllByTitle('Eliminar foto')[0]);
      expect(screen.getByText('Archivos adjuntados (1)')).toBeTruthy();
    });

    it('rechaza archivos de más de 15 MB y formatos no válidos, con aviso', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(archivo('enorme.jpg', 'image/jpeg', 16 * 1024 * 1024));
      subir(archivo('virus.exe', 'application/octet-stream'));
      expect(window.alert).toHaveBeenCalledTimes(2);
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatch(/15 MB/);
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[1][0]).toMatch(/formato válido/);
      expect(screen.queryByText(/Archivos adjuntados/)).toBeNull();
    });

    it('acepta PDF y video además de imágenes', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(archivo('plano.pdf', 'application/pdf'), archivo('recorrido.mp4', 'video/mp4'));
      await screen.findByText('Archivos adjuntados (2)');
    });

    it('no pasa de 8 archivos por solicitud', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(...Array.from({ length: 10 }, (_, i) => archivo(`f${i}.jpg`, 'image/jpeg')));
      await waitFor(() => expect(screen.getByText('Archivos adjuntados (8)')).toBeTruthy());
      subir(archivo('extra.jpg', 'image/jpeg'));
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Máximo 8'));
    });
  });

  describe('envío', () => {
    it('crea un lead de propietario con las especificaciones, el aviso de privacidad y sin foto si no adjuntó', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Departamento' }));
      siguiente(/Siguiente: Ubicación/);
      fireEvent.change(screen.getByDisplayValue('Las Condes'), { target: { value: 'Providencia' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: 140'), { target: { value: '85' } });
      fireEvent.change(screen.getByDisplayValue('3 Dormitorios'), { target: { value: '2' } });
      siguiente(/Siguiente: Fotos & Antecedentes/);
      siguiente(/Siguiente: Datos de Contacto/);
      llenarContacto('Pedro Dueño', '+56 9 3333 4444', 'pedro@ejemplo.cl');
      enviar();

      const { leads } = useLeadStore.getState();
      expect(leads).toHaveLength(1);
      expect(leads[0]).toMatchObject({
        fullName: 'Pedro Dueño',
        phone: '+56 9 3333 4444',
        email: 'pedro@ejemplo.cl',
        operationInterest: 'venta_propietario',
        source: 'captacion_propietarios',
        status: 'nuevo',
        propertyTitle: 'DEPARTAMENTO en Providencia (85 m²)',
        propertySpecs: { operation: 'venta', propertyType: 'departamento', commune: 'Providencia', areaM2: '85', bedrooms: '2' },
      });
      expect(leads[0].attachments).toEqual([]);
      expect(leads[0].notes.some((n) => n.includes('Sin fotografías adjuntas'))).toBe(true);
      expect(leads[0].privacyNotice?.version).toBeTruthy();
    });

    it('sin correo usa uno genérico, y con fotos las incluye en el lead', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      siguiente(/Siguiente: Fotos & Antecedentes/);
      subir(archivo('fachada.jpg', 'image/jpeg'));
      await screen.findByText('Archivos adjuntados (1)');
      siguiente(/Siguiente: Datos de Contacto/);
      expect(screen.getByText(/Se adjuntarán/)).toBeTruthy();
      llenarContacto('Ana Dueña', '+56 9 1111 0000');
      enviar();
      const lead = useLeadStore.getState().leads[0];
      expect(lead.email).toBe('propietario@sin-email.cl');
      expect(lead.attachments).toHaveLength(1);
      expect(lead.attachments?.[0]).toMatch(/^data:/);
    });

    it('sin nombre o sin teléfono no envía nada', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      hastaContacto();
      llenarContacto('Solo nombre', '');
      enviar();
      expect(useLeadStore.getState().leads).toHaveLength(0);
      expect(screen.queryByText(/Registrados con Éxito/)).toBeNull();
    });

    it('tras enviar muestra el éxito y "Volver al Portal" cierra el modal', () => {
      const cerrar = vi.fn();
      render(<OwnerValuation isOpen onClose={cerrar} />);
      hastaContacto();
      llenarContacto('Pedro Dueño', '+56 9 3333 4444');
      enviar();
      expect(screen.getByText('¡Solicitud y Antecedentes Registrados con Éxito!')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Volver al Portal' }));
      expect(cerrar).toHaveBeenCalledTimes(1);
    });
  });
});
