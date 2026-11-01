import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { OwnerValuation } from './OwnerValuation';
import { useLeadStore } from '../../crm/stores/useLeadStore';
import { registerLeadEvents } from '../../crm/services/leadEvents';
import { useMarketStore } from '../../../core/market/useMarketStore';
import { useLocaleStore } from '../../../core/i18n/i18n';

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

// La comuna es el primer selector del paso 2 (su texto cambia con el idioma)
const elegirComuna = (comuna = 'Las Condes') =>
  fireEvent.change(document.querySelector('select') as HTMLSelectElement, { target: { value: comuna } });

// Ubicación (con comuna elegida) y luego Fotos
const irAFotos = () => {
  siguiente(/Siguiente: Ubicación/);
  elegirComuna();
  siguiente(/Siguiente: Fotos & Antecedentes/);
};

const hastaContacto = () => {
  irAFotos();
  siguiente(/Siguiente: Datos de Contacto/);
};

// Los campos del paso de contacto se buscan por su tipo (sus textos cambian con el idioma)
const campo = (tipo: string) => document.querySelector(`form input[type="${tipo}"]`) as HTMLInputElement;
const llenarContacto = (nombre: string, telefono: string, correo = '') => {
  fireEvent.change(campo('text'), { target: { value: nombre } });
  fireEvent.change(campo('tel'), { target: { value: telefono } });
  if (correo) fireEvent.change(campo('email'), { target: { value: correo } });
};
const enviar = () => fireEvent.submit(document.querySelector('form')!);

describe('OwnerValuation (valorizador para propietarios)', () => {
  let dejarDeEscuchar: () => void;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    useLeadStore.setState({ leads: [] });
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [] });
    useLocaleStore.setState({ locale: 'es' });
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
      elegirComuna('Providencia');
      fireEvent.change(screen.getByPlaceholderText('Ej: 140'), { target: { value: '200' } });
      siguiente(/Siguiente: Fotos & Antecedentes/);
      expect(screen.getByText(/Haz clic para seleccionar fotos/)).toBeTruthy();
      siguiente(/Siguiente: Datos de Contacto/);
      expect(screen.getByPlaceholderText('Tu nombre y apellido')).toBeTruthy();
      atras();
      atras();
      expect((screen.getByPlaceholderText('Ej: 140') as HTMLInputElement).value).toBe('200');
      expect((screen.getByDisplayValue('Providencia') as HTMLSelectElement).value).toBe('Providencia');
    });
  });

  describe('ubicación', () => {
    const opciones = () =>
      Array.from(screen.getByDisplayValue('Selecciona la comuna').querySelectorAll('option')).map((o) => o.value);

    it('la comuna es obligatoria: sin elegirla no se puede pasar a las fotos', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      const next = () => screen.getByRole('button', { name: /Siguiente: Fotos & Antecedentes/ }) as HTMLButtonElement;
      expect(next().disabled).toBe(true);
      elegirComuna('Viña del Mar');
      expect(next().disabled).toBe(false);
    });

    it('ofrece las comunas de todo Chile, no solo las de Santiago', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      expect(opciones()).toContain('Punta Arenas');
      expect(opciones()).toContain('Arica');
      expect(opciones()).toContain('Vitacura');
    });

    it('si la corredora trabaja en una región, solo ofrece las comunas de esa región', () => {
      useMarketStore.setState({ serviceAreas: ['CL-VS'] });
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Siguiente: Ubicación/);
      expect(opciones()).toContain('Viña del Mar');
      expect(opciones()).not.toContain('Vitacura');
    });
  });

  describe('fotos y antecedentes', () => {
    it('adjunta una imagen, la muestra y se puede quitar con Eliminar todos', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      irAFotos();
      subir(archivo('living.jpg', 'image/jpeg'));
      await screen.findByText('Archivos adjuntados (1)');
      expect(screen.getByAltText('living.jpg')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar todos' }));
      expect(screen.queryByText(/Archivos adjuntados/)).toBeNull();
    });

    it('quita una foto con su botón', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      irAFotos();
      subir(archivo('a.jpg', 'image/jpeg'), archivo('b.jpg', 'image/jpeg'));
      await screen.findByText('Archivos adjuntados (2)');
      fireEvent.click(screen.getAllByTitle('Eliminar foto')[0]);
      expect(screen.getByText('Archivos adjuntados (1)')).toBeTruthy();
    });

    it('rechaza archivos de más de 15 MB y formatos no válidos, con aviso', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      irAFotos();
      subir(archivo('enorme.jpg', 'image/jpeg', 16 * 1024 * 1024));
      subir(archivo('virus.exe', 'application/octet-stream'));
      expect(window.alert).toHaveBeenCalledTimes(2);
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatch(/15 MB/);
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[1][0]).toMatch(/formato válido/);
      expect(screen.queryByText(/Archivos adjuntados/)).toBeNull();
    });

    it('acepta PDF y video además de imágenes', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      irAFotos();
      subir(archivo('plano.pdf', 'application/pdf'), archivo('recorrido.mp4', 'video/mp4'));
      await screen.findByText('Archivos adjuntados (2)');
    });

    it('no pasa de 8 archivos por solicitud', async () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      irAFotos();
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
      elegirComuna('Providencia');
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
      irAFotos();
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

  describe('subtítulo y zonas', () => {
    it('el subtítulo nombra el alcance de la corredora (Chile o sus regiones), no una región fija', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      expect(screen.getByText(/Más de 25 años de experiencia en Chile con Pilar Osorio/)).toBeTruthy();
      cleanup();
      useMarketStore.setState({ serviceAreas: ['CL-BI'] });
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      expect(screen.getByText(/experiencia en Biobío con Pilar Osorio/)).toBeTruthy();
    });
  });

  describe('en inglés', () => {
    beforeEach(() => useLocaleStore.setState({ locale: 'en' }));

    it('el encabezado, los pasos y las preguntas salen en inglés', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      expect(screen.getByText('Sell with UrbeGestión')).toBeTruthy();
      expect(screen.getByText('1. Operation')).toBeTruthy();
      expect(screen.getByText('What would you like to do with your property?')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Office / Commercial' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /List for Rent/ }));
      expect(screen.getByText('List Your Property for Rent')).toBeTruthy();
    });

    it('recorre los pasos en inglés: ubicación obligatoria, fotos y contacto', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Next: Location/);
      expect(screen.getByDisplayValue('Select the commune')).toBeTruthy();
      expect((screen.getByRole('button', { name: /Next: Photos & Documents/ }) as HTMLButtonElement).disabled).toBe(true);
      elegirComuna('Viña del Mar');
      expect(screen.getByRole('option', { name: '1 Bedroom' })).toBeTruthy();
      expect(screen.getByRole('option', { name: '5 or more Bedrooms' })).toBeTruthy();
      siguiente(/Next: Photos & Documents/);
      expect(screen.getByText('Click to select photos or drag them here')).toBeTruthy();
      siguiente(/Next: Contact Details/);
      expect(screen.getByPlaceholderText('Your first and last name')).toBeTruthy();
      expect(screen.getByText(/100% confidential/)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Send Request with Documents/ })).toBeTruthy();
    });

    it('los avisos de archivos no válidos salen en inglés', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Next: Location/);
      elegirComuna();
      siguiente(/Next: Photos & Documents/);
      subir(archivo('enorme.jpg', 'image/jpeg', 16 * 1024 * 1024));
      subir(archivo('virus.exe', 'application/octet-stream'));
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('The file "enorme.jpg" exceeds the maximum allowed size of 15 MB.');
      expect((window.alert as ReturnType<typeof vi.fn>).mock.calls[1][0]).toBe('The file "virus.exe" is not a valid format (images, videos or PDF only).');
    });

    it('enviar crea el mismo lead y la confirmación sale en inglés', () => {
      render(<OwnerValuation isOpen onClose={vi.fn()} />);
      siguiente(/Next: Location/);
      elegirComuna('Concepción');
      siguiente(/Next: Photos & Documents/);
      siguiente(/Next: Contact Details/);
      llenarContacto('Peter Owner', '+56 9 4444 3333');
      enviar();
      expect(useLeadStore.getState().leads[0]).toMatchObject({ operationInterest: 'venta_propietario', fullName: 'Peter Owner' });
      expect(screen.getByText('Request and Documents Registered Successfully!')).toBeTruthy();
      expect(screen.getByText(/will review the details and the/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Back to the Portal' })).toBeTruthy();
    });
  });
});
