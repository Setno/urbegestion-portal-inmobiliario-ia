import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AiChatWidget } from './AiChatWidget';
import { useChatStore } from '../stores/useChatStore';
import { useLeadStore } from '../../crm/stores/useLeadStore';
import { registerLeadEvents } from '../../crm/services/leadEvents';
import { usePropertyStore } from '../../catalogo/stores/usePropertyStore';
import { useMarketStore } from '../../../core/market/useMarketStore';
import { useLocaleStore } from '../../../core/i18n/i18n';
import { initialProperties } from '../../catalogo/data/initialProperties';

const CAJA = 'Pregúntale al Asistente IA sobre propiedades...';

const ultimoMensaje = () => {
  const { messages } = useChatStore.getState();
  return messages[messages.length - 1];
};
const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'Abrir Asistente IA' }));
const escribir = (texto: string) => {
  fireEvent.change(screen.getByPlaceholderText(CAJA), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
};

describe('AiChatWidget (asistente)', () => {
  let dejarDeEscuchar: () => void;

  beforeEach(() => {
    // Como al arrancar la app: el CRM escucha los leads que crea Captación
    dejarDeEscuchar = registerLeadEvents();
    localStorage.clear();
    // jsdom no implementa el desplazamiento automático del chat
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    useChatStore.getState().resetChat();
    useChatStore.getState().setIsOpen(false);
    useChatStore.getState().setIsTyping(false);
    useLeadStore.setState({ leads: [] });
    usePropertyStore.setState({ properties: [...initialProperties] });
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [] });
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
    dejarDeEscuchar();
    cleanup();
    vi.unstubAllGlobals();
  });

  it('parte cerrado, con el botón flotante, y se abre y se cierra', () => {
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    expect(screen.queryByPlaceholderText(CAJA)).toBeNull();
    abrir();
    expect(screen.getByPlaceholderText(CAJA)).toBeTruthy();
    expect(screen.getByText(/¿Qué tipo de propiedad estás buscando hoy/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Abrir Asistente IA' })).toBeNull();
  });

  it('el botón de enviar está desactivado con la caja vacía o solo con espacios', () => {
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    abrir();
    const enviar = screen.getByRole('button', { name: 'Enviar mensaje' }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(CAJA), { target: { value: '   ' } });
    expect(enviar.disabled).toBe(true);
  });

  it('muestra el mensaje del usuario, limpia la caja y responde con propiedades sugeridas', async () => {
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    abrir();
    escribir('Casas en Lo Barnechea');
    expect(screen.getAllByText('Casas en Lo Barnechea').length).toBeGreaterThan(0);
    expect((screen.getByPlaceholderText(CAJA) as HTMLInputElement).value).toBe('');
    await waitFor(() => expect(screen.getByText(initialProperties[1].title)).toBeTruthy());
    expect(ultimoMensaje()?.sender).toBe('bot');
    expect(useChatStore.getState().isTyping).toBe(false);
  });

  it('un clic en una propiedad sugerida la abre en la ficha', async () => {
    const abrirFicha = vi.fn();
    render(<AiChatWidget onOpenPropertyModal={abrirFicha} />);
    abrir();
    escribir('Casas en Lo Barnechea');
    const titulo = await screen.findByText(initialProperties[1].title);
    fireEvent.click(titulo);
    expect(abrirFicha).toHaveBeenCalledWith(expect.objectContaining({ id: initialProperties[1].id }));
  });

  it('no sugiere propiedades que no están publicadas', async () => {
    usePropertyStore.setState({
      properties: initialProperties.map((p, i) => (i === 1 ? { ...p, publicationStatus: 'borrador' as const } : p)),
    });
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    abrir();
    escribir('Casas en Lo Barnechea');
    await waitFor(() => expect(ultimoMensaje()?.sender).toBe('bot'));
    expect(screen.queryByText(initialProperties[1].title)).toBeNull();
  });

  it('con zonas de trabajo acotadas no sugiere propiedades de fuera de esas zonas', async () => {
    useMarketStore.setState({ serviceAreas: ['CL-VS'] });
    usePropertyStore.setState({
      properties: [
        { ...initialProperties[0], id: 'v1', title: 'Casa en Viña', commune: 'Viña del Mar', propertyType: 'casa' as const },
        { ...initialProperties[1], id: 's1', title: 'Casa en Lo Barnechea', commune: 'Lo Barnechea', propertyType: 'casa' as const },
      ],
    });
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    abrir();
    expect(screen.getByRole('button', { name: 'Casas en Viña del Mar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Casas en Lo Barnechea' })).toBeNull();
    escribir('Casas en Lo Barnechea');
    await waitFor(() => expect(ultimoMensaje()?.sender).toBe('bot'));
    expect(screen.queryByText('Casa en Lo Barnechea')).toBeNull();
  });

  it('Enter envía el mensaje y los chips rápidos también', async () => {
    render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
    abrir();
    const caja = screen.getByPlaceholderText(CAJA);
    fireEvent.change(caja, { target: { value: 'Deptos en Vitacura' } });
    fireEvent.keyDown(caja, { key: 'Enter' });
    await waitFor(() => expect(useChatStore.getState().messages.filter((m) => m.sender === 'user')).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Parcelas en Melipilla' }));
    await waitFor(() => expect(useChatStore.getState().messages.filter((m) => m.sender === 'user')).toHaveLength(2));
  });

  describe('agendar una visita desde el chat', () => {
    const pedirVisita = async () => {
      render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
      abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Agendar visita' }));
      await screen.findByText('Confirmar Datos para Agendamiento');
    };

    it('muestra el formulario de contacto con el aviso de privacidad', async () => {
      await pedirVisita();
      expect(screen.getByPlaceholderText('Tu nombre completo *')).toBeTruthy();
      expect(screen.getByPlaceholderText('Teléfono / WhatsApp *')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Ver detalle' })).toBeTruthy();
    });

    it('al enviarlo crea un lead del asistente con la visita, el aviso de privacidad y confirma en el chat', async () => {
      await pedirVisita();
      fireEvent.change(screen.getByPlaceholderText('Tu nombre completo *'), { target: { value: 'Luis Prueba' } });
      fireEvent.change(screen.getByPlaceholderText('Teléfono / WhatsApp *'), { target: { value: '+56 9 5555 4444' } });
      fireEvent.change(screen.getByDisplayValue('11:30 hrs'), { target: { value: '15:30' } });
      fireEvent.submit(screen.getByPlaceholderText('Tu nombre completo *').closest('form')!);

      const { leads } = useLeadStore.getState();
      expect(leads).toHaveLength(1);
      expect(leads[0]).toMatchObject({
        fullName: 'Luis Prueba',
        phone: '+56 9 5555 4444',
        source: 'asistente_ia',
        appointmentTime: '15:30',
        status: 'nuevo',
      });
      expect(leads[0].privacyNotice?.version).toBeTruthy();
      expect(screen.getByText(/He registrado tu solicitud con máxima prioridad/)).toBeTruthy();
      expect(screen.queryByText('Confirmar Datos para Agendamiento')).toBeNull();
    });

    it('sin nombre o sin teléfono no crea el lead', async () => {
      await pedirVisita();
      fireEvent.change(screen.getByPlaceholderText('Tu nombre completo *'), { target: { value: 'Solo nombre' } });
      fireEvent.submit(screen.getByPlaceholderText('Tu nombre completo *').closest('form')!);
      expect(useLeadStore.getState().leads).toHaveLength(0);
    });
  });

  describe('en inglés', () => {
    beforeEach(() => useLocaleStore.setState({ locale: 'en' }));

    it('el botón, la bienvenida, el campo y las sugerencias salen en inglés', () => {
      render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open AI Assistant' }));
      expect(screen.getByText(/I am here to help you find the ideal property/)).toBeTruthy();
      expect(screen.getByText(/in which commune would you like to live/)).toBeTruthy();
      expect(screen.getByPlaceholderText('Ask the AI Assistant about properties...')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Sell my property' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Book a visit' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Houses in Lo Barnechea' })).toBeTruthy();
    });

    it('una sugerencia en inglés encuentra la propiedad y la respuesta sale en inglés', async () => {
      render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open AI Assistant' }));
      fireEvent.click(screen.getByRole('button', { name: 'Houses in Lo Barnechea' }));
      await waitFor(() => expect(screen.getByText(initialProperties[1].title)).toBeTruthy());
      expect(screen.getByText(/I found some highlighted options/)).toBeTruthy();
    });

    it('agendar una visita: formulario y confirmación en inglés', async () => {
      render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open AI Assistant' }));
      fireEvent.click(screen.getByRole('button', { name: 'Book a visit' }));
      await screen.findByText('Confirm Details to Schedule');
      fireEvent.change(screen.getByPlaceholderText('Your full name *'), { target: { value: 'Mary Chat' } });
      fireEvent.change(screen.getByPlaceholderText('Phone / WhatsApp *'), { target: { value: '+56 9 3333 2222' } });
      fireEvent.submit(screen.getByPlaceholderText('Your full name *').closest('form')!);
      expect(screen.getByText(/Perfect, Mary Chat! I have registered your request/)).toBeTruthy();
    });

    it('el mensaje de bienvenida cambia con el idioma sin perder la conversación', () => {
      render(<AiChatWidget onOpenPropertyModal={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Open AI Assistant' }));
      expect(useChatStore.getState().messages[0].id).toBe('msg-welcome');
      expect(screen.queryByText(/¡Hola! Soy/)).toBeNull();
    });
  });
});
