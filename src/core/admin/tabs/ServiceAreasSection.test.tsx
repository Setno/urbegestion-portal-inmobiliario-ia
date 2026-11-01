import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ServiceAreasSection } from './ServiceAreasSection';
import { useAuthStore } from '../../auth/useAuthStore';
import { useMarketStore } from '../../market/useMarketStore';

const entrar = (role: 'admin' | 'agente') =>
  useAuthStore.setState({ membership: { tenantName: 'Corredora de prueba', role, publicationMode: 'con_aprobacion' } });

const casilla = (nombre: string) => screen.getByRole('checkbox', { name: nombre }) as HTMLInputElement;

describe('ServiceAreasSection (dónde trabaja la corredora)', () => {
  beforeEach(() => {
    useAuthStore.setState({ membership: null });
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [], loaded: true });
  });

  afterEach(() => cleanup());

  it('el agente y quien no tiene sesión no la ven', () => {
    entrar('agente');
    const { container } = render(<ServiceAreasSection />);
    expect(container.innerHTML).toBe('');
    cleanup();
    useAuthStore.setState({ membership: null });
    expect(render(<ServiceAreasSection />).container.innerHTML).toBe('');
  });

  it('el administrador ve las 16 regiones de Chile, todas sin marcar, y el aviso de que sin selección vale todo el país', () => {
    entrar('admin');
    render(<ServiceAreasSection />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(16);
    expect(casilla('Valparaíso').checked).toBe(false);
    expect(screen.getByText(/Sin ninguna región marcada se ofrece todo Chile/)).toBeTruthy();
  });

  it('muestra marcadas las regiones ya elegidas', () => {
    entrar('admin');
    useMarketStore.setState({ serviceAreas: ['CL-VS', 'CL-BI'] });
    render(<ServiceAreasSection />);
    expect(casilla('Valparaíso').checked).toBe(true);
    expect(casilla('Biobío').checked).toBe(true);
    expect(casilla('Maule').checked).toBe(false);
  });

  it('guarda las regiones marcadas en la tienda de mercado', async () => {
    entrar('admin');
    render(<ServiceAreasSection />);
    fireEvent.click(casilla('Valparaíso'));
    fireEvent.click(casilla('Región Metropolitana de Santiago'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar zonas' }));
    await waitFor(() => expect(useMarketStore.getState().serviceAreas.sort()).toEqual(['CL-RM', 'CL-VS']));
    expect(await screen.findByText(/Zonas guardadas/)).toBeTruthy();
  });

  it('desmarcar todas y guardar vuelve a ofrecer todo el país', async () => {
    entrar('admin');
    useMarketStore.setState({ serviceAreas: ['CL-VS'] });
    render(<ServiceAreasSection />);
    fireEvent.click(casilla('Valparaíso'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar zonas' }));
    await waitFor(() => expect(useMarketStore.getState().serviceAreas).toEqual([]));
  });

  it('el botón de guardar solo se activa cuando hay cambios', () => {
    entrar('admin');
    render(<ServiceAreasSection />);
    const guardar = screen.getByRole('button', { name: 'Guardar zonas' }) as HTMLButtonElement;
    expect(guardar.disabled).toBe(true);
    fireEvent.click(casilla('Maule'));
    expect(guardar.disabled).toBe(false);
    fireEvent.click(casilla('Maule'));
    expect(guardar.disabled).toBe(true);
  });
});
