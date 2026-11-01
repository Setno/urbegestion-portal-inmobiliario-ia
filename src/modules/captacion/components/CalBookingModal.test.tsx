import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { CalBookingModal } from './CalBookingModal';
import { useLeadStore } from '../../crm/stores/useLeadStore';
import { registerLeadEvents } from '../../crm/services/leadEvents';
import { initialProperties } from '../../catalogo/data/initialProperties';

const casa = initialProperties[1]; // venta

const formulario = () => fireEvent.click(screen.getByRole('button', { name: /Formulario Rápido/ }));
const llenar = (nombre: string, telefono: string, fecha = '2026-12-10') => {
  fireEvent.change(screen.getByPlaceholderText('Tu nombre y apellido'), { target: { value: nombre } });
  fireEvent.change(screen.getByPlaceholderText('+56 9 1234 5678'), { target: { value: telefono } });
  const dia = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dia, { target: { value: fecha } });
};
const enviar = () => fireEvent.submit(screen.getByPlaceholderText('Tu nombre y apellido').closest('form')!);

describe('CalBookingModal (agendar visita)', () => {
  let dejarDeEscuchar: () => void;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    useLeadStore.setState({ leads: [] });
    dejarDeEscuchar = registerLeadEvents();
  });

  afterEach(() => {
    dejarDeEscuchar();
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cerrado no pinta nada', () => {
    const { container } = render(<CalBookingModal isOpen={false} property={casa} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('abierto muestra la propiedad y el calendario interactivo con la nota de la visita', () => {
    render(<CalBookingModal isOpen property={casa} onClose={vi.fn()} />);
    expect(screen.getByText(new RegExp(casa.title))).toBeTruthy();
    const iframe = screen.getByTitle('Cal.com Booking Scheduler') as HTMLIFrameElement;
    expect(iframe.src).toContain('embed=true');
    expect(decodeURIComponent(iframe.src)).toContain(`Visita para ${casa.title}`);
    expect(screen.getByRole('link', { name: /Abrir en Cal.com/ })).toBeTruthy();
  });

  it('sin propiedad ofrece atención directa', () => {
    render(<CalBookingModal isOpen property={null} onClose={vi.fn()} />);
    expect(screen.getByText(/Atención directa con Pilar Osorio/)).toBeTruthy();
  });

  it('cambia entre el calendario y el formulario rápido', () => {
    render(<CalBookingModal isOpen property={casa} onClose={vi.fn()} />);
    formulario();
    expect(screen.getByPlaceholderText('Tu nombre y apellido')).toBeTruthy();
    expect(screen.queryByTitle('Cal.com Booking Scheduler')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Calendario Interactivo/ }));
    expect(screen.getByTitle('Cal.com Booking Scheduler')).toBeTruthy();
  });

  it('Confirmar Visita crea un lead con visita agendada, la propiedad y el aviso de privacidad', () => {
    render(<CalBookingModal isOpen property={casa} onClose={vi.fn()} />);
    formulario();
    llenar('Marta Visita', '+56 9 1212 3434');
    fireEvent.change(screen.getByDisplayValue('11:00 hrs (Mañana)'), { target: { value: '15:30' } });
    enviar();

    const { leads } = useLeadStore.getState();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      fullName: 'Marta Visita',
      phone: '+56 9 1212 3434',
      email: 'visita@cal.cl',
      status: 'visita_agendada',
      appointmentDate: '2026-12-10',
      appointmentTime: '15:30',
      propertyInterestId: casa.id,
      propertyTitle: casa.title,
      operationInterest: 'compra',
      source: 'ficha_propiedad',
    });
    expect(leads[0].privacyNotice?.version).toBeTruthy();
    expect(screen.getByText('¡Visita Agendada y Sincronizada!')).toBeTruthy();
  });

  it('en una propiedad de arriendo el interés del lead es arriendo', () => {
    render(<CalBookingModal isOpen property={initialProperties[2]} onClose={vi.fn()} />);
    formulario();
    llenar('Rita Arriendo', '+56 9 7777 8888');
    enviar();
    expect(useLeadStore.getState().leads[0].operationInterest).toBe('arriendo');
  });

  it('sin nombre o sin teléfono no crea el lead', () => {
    render(<CalBookingModal isOpen property={casa} onClose={vi.fn()} />);
    formulario();
    llenar('Solo nombre', '');
    enviar();
    expect(useLeadStore.getState().leads).toHaveLength(0);
  });

  it('tras confirmar, el aviso de éxito se cierra solo a los 2,8 segundos', () => {
    vi.useFakeTimers();
    const cerrar = vi.fn();
    render(<CalBookingModal isOpen property={casa} onClose={cerrar} />);
    formulario();
    llenar('Marta Visita', '+56 9 1212 3434');
    enviar();
    expect(cerrar).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(cerrar).toHaveBeenCalledTimes(1);
  });
});
