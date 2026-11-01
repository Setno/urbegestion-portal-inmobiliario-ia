import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import { PropertyModal } from './PropertyModal';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useLeadStore } from '../../crm/stores/useLeadStore';
import { registerLeadEvents } from '../../crm/services/leadEvents';
import { useLocaleStore } from '../../../core/i18n/i18n';
import { initialProperties } from '../data/initialProperties';

const casa = initialProperties[1]; // venta, 24.900 UF, destacada, 5 dorm., 5 baños, 4 estac.
const arriendo = initialProperties[2]; // arriendo, 45 UF

const pintar = (property = casa, onClose = vi.fn()) => render(<PropertyModal property={property} onClose={onClose} />);

describe('PropertyModal (ficha de propiedad)', () => {
  let dejarDeEscuchar: () => void;
  const writeText = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    writeText.mockClear();
    usePropertyStore.setState({ currency: 'UF' });
    useLeadStore.setState({ leads: [] });
    useLocaleStore.setState({ locale: 'es' });
    dejarDeEscuchar = registerLeadEvents();
  });

  afterEach(() => {
    dejarDeEscuchar();
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sin propiedad no pinta nada', () => {
    const { container } = render(<PropertyModal property={null} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra el título, la ubicación, el precio y su equivalencia en pesos', () => {
    pintar();
    expect(screen.getAllByText(casa.title).length).toBeGreaterThan(0);
    expect(screen.getByText(`${casa.commune} • ${casa.address}`)).toBeTruthy();
    expect(screen.getByText('24.900 UF')).toBeTruthy();
    expect(screen.getByText('24.900 UF ≈ $962.385.000 CLP')).toBeTruthy();
    expect(screen.getByText('En Venta')).toBeTruthy();
    expect(screen.getByText('Propiedad Exclusiva')).toBeTruthy();
  });

  it('muestra las características técnicas, la descripción y el equipamiento', () => {
    pintar();
    expect(screen.getByText('5 Dorm.')).toBeTruthy();
    expect(screen.getByText('5 Baños')).toBeTruthy();
    expect(screen.getByText('4 Autos')).toBeTruthy();
    expect(screen.getByText('Descripción de la Propiedad')).toBeTruthy();
    expect(screen.getByText('Equipamiento & Terminaciones')).toBeTruthy();
    for (const f of casa.features) expect(screen.getByText(f)).toBeTruthy();
  });

  it('el botón de cerrar avisa al padre', () => {
    const cerrar = vi.fn();
    pintar(casa, cerrar);
    fireEvent.click(screen.getByLabelText('Cerrar modal'));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('las miniaturas cambian la foto principal', () => {
    pintar();
    const principal = () => screen.getAllByAltText(casa.title)[0] as HTMLImageElement;
    expect(principal().src).toBe(casa.images[0]);
    const miniaturas = document.querySelectorAll('button img[alt=""]');
    expect(miniaturas.length).toBe(casa.images.length);
    fireEvent.click(miniaturas[1].closest('button')!);
    expect(principal().src).toBe(casa.images[1]);
  });

  it('el mapa usa la consulta de la propiedad y enlaza a Google Maps', () => {
    pintar();
    expect(screen.getByTitle(`Mapa de ${casa.title}`)).toBeTruthy();
    const enlace = screen.getByRole('link', { name: /Abrir en Google Maps/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(enlace.href)).toContain(casa.mapQuery!);
  });

  it('sin consulta de mapa arma una con la dirección, la comuna y el país del mercado', () => {
    pintar({ ...casa, mapQuery: undefined });
    const enlace = screen.getByRole('link', { name: /Abrir en Google Maps/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(enlace.href)).toContain(`${casa.address}, ${casa.commune}, Chile`);
  });

  it('Copiar Texto copia la ficha comercial y lo confirma un momento', () => {
    vi.useFakeTimers();
    pintar();
    fireEvent.click(screen.getByRole('button', { name: /Copiar Texto/ }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const texto = writeText.mock.calls[0][0] as string;
    expect(texto).toContain('FICHA INMOBILIARIA');
    expect(texto).toContain(casa.title);
    expect(texto).toContain('24.900 UF');
    expect(screen.getByRole('button', { name: /Ficha Copiada/ })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2300);
    });
    expect(screen.queryByRole('button', { name: /Ficha Copiada/ })).toBeNull();
  });

  it('Enviar por WhatsApp y Compartir enlazan a WhatsApp con la ficha', () => {
    pintar();
    const enviar = screen.getByRole('link', { name: /Enviar por WhatsApp/ }) as HTMLAnchorElement;
    expect(enviar.href.startsWith('https://api.whatsapp.com/send?text=')).toBe(true);
    expect(decodeURIComponent(enviar.href)).toContain(casa.title);
    expect(screen.getByTitle('Compartir por WhatsApp')).toBeTruthy();
  });

  it('una propiedad en arriendo muestra En Arriendo', () => {
    pintar(arriendo);
    expect(screen.getByText('En Arriendo')).toBeTruthy();
  });

  describe('visita desde la ficha', () => {
    const abrirFormulario = () => fireEvent.click(screen.getByRole('button', { name: /Formulario Rápido/ }));

    it('ofrece agendar con Cal.com o con el formulario rápido', () => {
      pintar();
      expect(screen.getByText('¿Deseas visitar esta propiedad?')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Agendar con Cal.com/ }));
      expect(screen.getByText('Agendar Visita Inmobiliaria')).toBeTruthy();
    });

    it('el formulario rápido crea un lead con la visita, la propiedad y el aviso de privacidad', () => {
      pintar();
      abrirFormulario();
      expect(screen.getByText(`Agendar Visita a "${casa.title}"`)).toBeTruthy();
      fireEvent.change(screen.getByPlaceholderText('Tu nombre y apellido'), { target: { value: 'Luisa Ficha' } });
      fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { value: '+56 9 7777 6666' } });
      fireEvent.change(document.querySelector('input[type="date"]') as HTMLInputElement, { target: { value: '2026-12-12' } });
      fireEvent.change(screen.getByDisplayValue('Mañana (09:30 - 11:00)'), { target: { value: '15:30' } });
      fireEvent.submit(screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!);

      const { leads } = useLeadStore.getState();
      expect(leads).toHaveLength(1);
      expect(leads[0]).toMatchObject({
        fullName: 'Luisa Ficha',
        phone: '+56 9 7777 6666',
        status: 'visita_agendada',
        appointmentDate: '2026-12-12',
        appointmentTime: '15:30',
        propertyInterestId: casa.id,
        operationInterest: 'compra',
        budgetAmount: casa.priceAmount,
        budgetCurrency: 'UF',
        source: 'ficha_propiedad',
      });
      expect(leads[0].privacyNotice?.version).toBeTruthy();
      expect(screen.getByText(/¡Visita agendada! Pilar Osorio te contactará al \+56 9 7777 6666/)).toBeTruthy();
    });

    it('sin nombre o sin teléfono no crea el lead', () => {
      pintar();
      abrirFormulario();
      fireEvent.change(screen.getByPlaceholderText('Tu nombre y apellido'), { target: { value: 'Solo nombre' } });
      fireEvent.submit(screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!);
      expect(useLeadStore.getState().leads).toHaveLength(0);
    });

    it('en una propiedad de arriendo el interés del lead es arriendo', () => {
      pintar(arriendo);
      abrirFormulario();
      fireEvent.change(screen.getByPlaceholderText('Tu nombre y apellido'), { target: { value: 'Rita' } });
      fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { value: '+56 9 1' } });
      fireEvent.submit(screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!);
      expect(useLeadStore.getState().leads[0].operationInterest).toBe('arriendo');
    });

    it('Cancelar cierra el formulario y vuelve a las dos opciones', () => {
      pintar();
      abrirFormulario();
      const form = screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!;
      fireEvent.click(within(form).getByRole('button', { name: 'Cancelar' }));
      expect(screen.getByText('¿Deseas visitar esta propiedad?')).toBeTruthy();
    });
  });

  describe('en inglés', () => {
    beforeEach(() => useLocaleStore.setState({ locale: 'en' }));

    it('muestra la ficha en inglés', () => {
      pintar();
      expect(screen.getByText('For Sale')).toBeTruthy();
      expect(screen.getByText('Exclusive Property')).toBeTruthy();
      expect(screen.getByText('Property Description')).toBeTruthy();
      expect(screen.getByText('Features & Finishes')).toBeTruthy();
      expect(screen.getByText('5 Bed.')).toBeTruthy();
      expect(screen.getByText('4 Cars')).toBeTruthy();
      expect(screen.getByLabelText('Close dialog')).toBeTruthy();
      expect(screen.getByTitle(`Map of ${casa.title}`)).toBeTruthy();
      expect(screen.getByText('Would you like to visit this property?')).toBeTruthy();
    });

    it('la ficha comercial que se copia sale en inglés, con los datos de la propiedad', () => {
      pintar();
      fireEvent.click(screen.getByRole('button', { name: /Copy Text/ }));
      const texto = writeText.mock.calls[0][0] as string;
      expect(texto).toContain('PROPERTY SHEET - URBEGESTIÓN');
      expect(texto).toContain(`*Location:* ${casa.address}, ${casa.commune}`);
      expect(texto).toContain('*Price:* *24.900 UF* (Sale)');
      expect(texto).toContain('*Bedrooms:* 5 | 🚿 *Bathrooms:* 5');
      expect(decodeURIComponent(decodeURIComponent(texto.split('text=')[1]))).toContain('Hello Pilar Osorio, I would like to arrange a visit');
      expect(screen.getByRole('button', { name: /Sheet Copied/ })).toBeTruthy();
    });

    it('el formulario de visita se muestra y confirma en inglés', () => {
      pintar();
      fireEvent.click(screen.getByRole('button', { name: /Quick Form/ }));
      expect(screen.getByText(`Book a Visit to "${casa.title}"`)).toBeTruthy();
      expect(screen.getByDisplayValue('Morning (09:30 - 11:00)')).toBeTruthy();
      fireEvent.change(screen.getByPlaceholderText('Your first and last name'), { target: { value: 'Mary Sheet' } });
      fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { value: '+56 9 5555 4444' } });
      fireEvent.submit(screen.getByPlaceholderText('Your first and last name').closest('form')!);
      expect(screen.getByText(/Visit booked! Pilar Osorio will contact you at \+56 9 5555 4444/)).toBeTruthy();
    });
  });
});
