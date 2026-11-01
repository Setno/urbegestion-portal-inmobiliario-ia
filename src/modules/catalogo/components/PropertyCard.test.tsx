import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useLocaleStore } from '../../../core/i18n/i18n';
import { initialProperties } from '../data/initialProperties';

const casa = initialProperties[1]; // venta, destacada, 5 dorm., 5 baños, 4 estac.

const pintar = (onDetails = vi.fn(), onBooking = vi.fn()) =>
  render(<PropertyCard property={casa} onOpenDetails={onDetails} onOpenBooking={onBooking} />);

describe('PropertyCard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    usePropertyStore.setState({ currency: 'UF' });
    useLocaleStore.setState({ locale: 'es' });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('muestra el precio, la operación, el tipo y las características en español', () => {
    pintar();
    expect(screen.getByText('24.900 UF')).toBeTruthy();
    expect(screen.getByText('En Venta')).toBeTruthy();
    expect(screen.getByText('Casa')).toBeTruthy();
    expect(screen.getByText('Exclusiva')).toBeTruthy();
    expect(screen.getByText('5 Dorm.')).toBeTruthy();
    expect(screen.getByText('5 Baños')).toBeTruthy();
    expect(screen.getByText('4 Estac.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ver Ficha/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Agendar Cita/ })).toBeTruthy();
  });

  it('en inglés se muestra todo en inglés', () => {
    useLocaleStore.setState({ locale: 'en' });
    pintar();
    expect(screen.getByText('For Sale')).toBeTruthy();
    expect(screen.getByText('House')).toBeTruthy();
    expect(screen.getByText('Exclusive')).toBeTruthy();
    expect(screen.getByText('5 Bed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /View Details/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Book a Visit/ })).toBeTruthy();
  });

  it('Ver Ficha y Agendar Cita avisan con la propiedad', () => {
    const detalles = vi.fn();
    const cita = vi.fn();
    pintar(detalles, cita);
    fireEvent.click(screen.getByRole('button', { name: /Ver Ficha/ }));
    fireEvent.click(screen.getByRole('button', { name: /Agendar Cita/ }));
    expect(detalles).toHaveBeenCalledWith(casa);
    expect(cita).toHaveBeenCalledWith(casa);
  });

  it('compartir por WhatsApp arma el mensaje en el idioma activo, con los datos de la propiedad', () => {
    const abrir = vi.spyOn(window, 'open').mockImplementation(() => null);
    pintar();
    fireEvent.click(screen.getAllByTitle('Compartir Ficha por WhatsApp')[0]);
    const url = abrir.mock.calls[0][0] as string;
    // el mensaje de contacto va dentro de otro enlace, por eso se decodifica dos veces
    const texto = decodeURIComponent(decodeURIComponent(url.split('text=')[1]));
    expect(texto).toContain(casa.title);
    expect(texto).toContain('24.900 UF');
    expect(texto).toContain('(En Venta)');
    expect(texto).toContain('5 Dorms');
    expect(texto).toContain('Hola Pilar Osorio, vi la propiedad');
  });

  it('el mensaje de WhatsApp también sale en inglés', () => {
    useLocaleStore.setState({ locale: 'en' });
    const abrir = vi.spyOn(window, 'open').mockImplementation(() => null);
    pintar();
    fireEvent.click(screen.getAllByTitle('Share on WhatsApp')[0]);
    const texto = decodeURIComponent(decodeURIComponent((abrir.mock.calls[0][0] as string).split('text=')[1]));
    expect(texto).toContain('Price: *24.900 UF* (For Sale)');
    expect(texto).toContain('Hello Pilar Osorio, I saw the property');
  });
});
