import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { PropertiesTab } from './PropertiesTab';
import { usePropertyStore } from '../stores/usePropertyStore';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import { useMarketStore } from '../../../core/market/useMarketStore';
import { initialProperties } from '../data/initialProperties';
import type { Property, PublicationStatus } from '../types/property';
import type { Role } from '../../../core/auth/permissions';
import type { PublicationMode } from '../../../core/auth/authService';

const base = initialProperties[0];
const conEstado = (id: string, title: string, publicationStatus?: PublicationStatus): Property => ({
  ...base,
  id,
  title,
  publicationStatus,
});

const entrar = (role: Role, publicationMode: PublicationMode) =>
  useAuthStore.setState({ membership: { tenantName: 'Corredora de prueba', role, publicationMode } });

const abrirNueva = () => fireEvent.click(screen.getByRole('button', { name: /Publicar Nueva Propiedad|Crear borrador/ }));

const elegirComuna = (comuna: string) =>
  fireEvent.change(screen.getByDisplayValue('Selecciona la comuna'), { target: { value: comuna } });

const llenarFormulario = (titulo: string, direccion: string, comuna = 'Las Condes') => {
  fireEvent.change(screen.getByPlaceholderText(/Penthouse Dúplex con Terraza/), { target: { value: titulo } });
  fireEvent.change(screen.getByPlaceholderText(/Av\. Nueva Costanera/), { target: { value: direccion } });
  elegirComuna(comuna);
};

const guardar = (nombre: RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

const tarjeta = (titulo: string) => screen.getByText(titulo, { selector: 'h4' }).closest('.group') as HTMLElement;

const estado = (id: string) => usePropertyStore.getState().properties.find((p) => p.id === id)?.publicationStatus;

describe('PropertiesTab (gestor de propiedades)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ membership: null });
    useMarketStore.setState({ marketId: 'cl', serviceAreas: [] });
    usePropertyStore.setState({ properties: [conEstado('p1', 'Casa Uno'), conEstado('p2', 'Casa Dos')] });
  });

  afterEach(() => cleanup());

  describe('sin sesión de corredora (modo local): todo se publica directo', () => {
    it('lista las propiedades sin mostrar estados de publicación', () => {
      render(<PropertiesTab />);
      expect(screen.getByText('Casa Uno')).toBeTruthy();
      expect(screen.getByText('Casa Dos')).toBeTruthy();
      expect(screen.queryByText('Publicada')).toBeNull();
    });

    it('crea una propiedad con los datos del formulario, publicada y con foto por defecto', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('Depto nuevo en Ñuñoa', 'Av. Irarrázaval 1234');
      fireEvent.change(screen.getByDisplayValue('12000'), { target: { value: '9500' } });
      guardar(/Crear Propiedad/);

      const creada = usePropertyStore.getState().properties.find((p) => p.title === 'Depto nuevo en Ñuñoa')!;
      expect(creada).toBeTruthy();
      expect(creada.priceUf).toBe(9500);
      expect(creada.address).toBe('Av. Irarrázaval 1234');
      expect(creada.operation).toBe('venta');
      expect(creada.publicationStatus).toBe('publicada');
      expect(creada.images).toHaveLength(1);
      expect(screen.queryByText('Publicar Nueva Propiedad', { selector: 'h3' })).toBeNull(); // el formulario se cerró
    });

    it('la comuna es obligatoria: sin elegirla no se guarda', () => {
      render(<PropertiesTab />);
      abrirNueva();
      fireEvent.change(screen.getByPlaceholderText(/Penthouse Dúplex con Terraza/), { target: { value: 'Sin comuna' } });
      fireEvent.change(screen.getByPlaceholderText(/Av\. Nueva Costanera/), { target: { value: 'Calle 9' } });
      fireEvent.submit(screen.getByPlaceholderText(/Av\. Nueva Costanera/).closest('form')!);
      expect(usePropertyStore.getState().properties).toHaveLength(2);
    });

    it('guarda la comuna elegida, también fuera de Santiago', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('Casa en Concepción', 'Calle 10', 'Concepción');
      guardar(/Crear Propiedad/);
      expect(usePropertyStore.getState().properties.find((p) => p.title === 'Casa en Concepción')?.commune).toBe('Concepción');
    });

    it('con zonas de trabajo acotadas solo ofrece las comunas de esas regiones', () => {
      useMarketStore.setState({ serviceAreas: ['CL-BI'] });
      render(<PropertiesTab />);
      abrirNueva();
      const opciones = Array.from(screen.getByDisplayValue('Selecciona la comuna').querySelectorAll('option')).map((o) => o.value);
      expect(opciones).toContain('Concepción');
      expect(opciones).not.toContain('Vitacura');
    });

    it('editar una propiedad de una comuna fuera de las zonas actuales conserva su comuna', () => {
      useMarketStore.setState({ serviceAreas: ['CL-BI'] });
      usePropertyStore.setState({ properties: [{ ...conEstado('p1', 'Casa Uno'), commune: 'Vitacura' }] });
      render(<PropertiesTab />);
      fireEvent.click(within(tarjeta('Casa Uno')).getByRole('button', { name: /Editar/ }));
      expect((screen.getByDisplayValue('Vitacura') as HTMLSelectElement).value).toBe('Vitacura');
      guardar(/Guardar Cambios/);
      expect(usePropertyStore.getState().properties[0].commune).toBe('Vitacura');
    });

    it('sin título o sin dirección no guarda nada', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('Solo título', '');
      fireEvent.submit(screen.getByPlaceholderText(/Av\. Nueva Costanera/).closest('form')!);
      expect(usePropertyStore.getState().properties).toHaveLength(2);
    });

    it('agrega una foto por URL y permite dejarla como principal', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('Con fotos', 'Calle 1');
      const url = screen.getByPlaceholderText(/pegar URL web de imagen/);
      fireEvent.change(url, { target: { value: 'https://ejemplo.cl/a.jpg' } });
      fireEvent.click(screen.getByRole('button', { name: 'Agregar URL' }));
      fireEvent.change(url, { target: { value: 'https://ejemplo.cl/b.jpg' } });
      fireEvent.click(screen.getByRole('button', { name: 'Agregar URL' }));
      guardar(/Crear Propiedad/);
      const creada = usePropertyStore.getState().properties.find((p) => p.title === 'Con fotos')!;
      expect(creada.images).toEqual(['https://ejemplo.cl/a.jpg', 'https://ejemplo.cl/b.jpg']);
    });

    it('editar precarga los datos y guarda los cambios sin crear otra propiedad', () => {
      render(<PropertiesTab />);
      fireEvent.click(within(tarjeta('Casa Dos')).getByRole('button', { name: /Editar/ }));
      const titulo = screen.getByDisplayValue('Casa Dos');
      fireEvent.change(titulo, { target: { value: 'Casa Dos Remodelada' } });
      guardar(/Guardar Cambios/);
      const { properties } = usePropertyStore.getState();
      expect(properties).toHaveLength(2);
      expect(properties.find((p) => p.id === 'p2')?.title).toBe('Casa Dos Remodelada');
      expect(properties.find((p) => p.id === 'p1')?.title).toBe('Casa Uno');
    });

    it('eliminar quita la propiedad', () => {
      render(<PropertiesTab />);
      fireEvent.click(within(tarjeta('Casa Uno')).getByTitle('Eliminar Propiedad'));
      expect(usePropertyStore.getState().properties.map((p) => p.id)).toEqual(['p2']);
    });

    it('cerrar el formulario sin guardar no cambia nada', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('No se guarda', 'Calle 2');
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(usePropertyStore.getState().properties).toHaveLength(2);
    });
  });

  describe('agente en una corredora con aprobación (proponente)', () => {
    beforeEach(() => entrar('agente', 'con_aprobacion'));

    it('ofrece "Crear borrador" y lo que crea queda en borrador', () => {
      render(<PropertiesTab />);
      expect(screen.queryByRole('button', { name: 'Publicar Nueva Propiedad' })).toBeNull();
      abrirNueva();
      llenarFormulario('Propuesta del agente', 'Calle 3');
      guardar(/Crear Propiedad/);
      const creada = usePropertyStore.getState().properties.find((p) => p.title === 'Propuesta del agente')!;
      expect(creada.publicationStatus).toBe('borrador');
    });

    it('un borrador o rechazada se puede enviar a revisión; una publicada no ofrece acciones', () => {
      usePropertyStore.setState({
        properties: [conEstado('b', 'En borrador', 'borrador'), conEstado('r', 'Rechazada', 'rechazada'), conEstado('v', 'Ya publicada', 'publicada')],
      });
      render(<PropertiesTab />);
      expect(within(tarjeta('Ya publicada')).queryByRole('button', { name: 'Enviar a revisión' })).toBeNull();
      fireEvent.click(within(tarjeta('En borrador')).getByRole('button', { name: 'Enviar a revisión' }));
      expect(estado('b')).toBe('en_revision');
      expect(within(tarjeta('En borrador')).getByText('En revisión')).toBeTruthy();
      expect(within(tarjeta('En borrador')).queryByRole('button', { name: 'Enviar a revisión' })).toBeNull();
    });

    it('editar una propiedad ya publicada la devuelve a revisión', () => {
      usePropertyStore.setState({ properties: [conEstado('v', 'Ya publicada', 'publicada')] });
      render(<PropertiesTab />);
      fireEvent.click(within(tarjeta('Ya publicada')).getByRole('button', { name: /Editar/ }));
      guardar(/Guardar Cambios/);
      expect(estado('v')).toBe('en_revision');
    });

    it('muestra el motivo cuando el administrador rechazó la propuesta', () => {
      usePropertyStore.setState({
        properties: [{ ...conEstado('r', 'Rechazada', 'rechazada'), rejectionReason: 'Faltan fotos del living' }],
      });
      render(<PropertiesTab />);
      expect(screen.getByText(/Motivo del rechazo: Faltan fotos del living/)).toBeTruthy();
    });
  });

  describe('administrador (publicador)', () => {
    beforeEach(() => entrar('admin', 'con_aprobacion'));

    it('lo que crea sale publicado', () => {
      render(<PropertiesTab />);
      abrirNueva();
      llenarFormulario('Del administrador', 'Calle 4');
      guardar(/Crear Propiedad/);
      expect(usePropertyStore.getState().properties.find((p) => p.title === 'Del administrador')?.publicationStatus).toBe('publicada');
    });

    it('aprueba una propiedad en revisión y la deja publicada con fecha de aprobación', () => {
      usePropertyStore.setState({ properties: [conEstado('e', 'Esperando', 'en_revision')] });
      render(<PropertiesTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Aprobar y publicar' }));
      const aprobada = usePropertyStore.getState().properties[0];
      expect(aprobada.publicationStatus).toBe('publicada');
      expect(aprobada.approvedAt).toBeTruthy();
    });

    it('rechazar exige un motivo y lo guarda', () => {
      usePropertyStore.setState({ properties: [conEstado('e', 'Esperando', 'en_revision')] });
      render(<PropertiesTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
      const confirmar = screen.getAllByRole('button', { name: 'Rechazar' }).pop() as HTMLButtonElement;
      expect(confirmar.disabled).toBe(true);
      fireEvent.change(screen.getByLabelText('Motivo del rechazo'), { target: { value: '   ' } });
      expect(confirmar.disabled).toBe(true);
      fireEvent.change(screen.getByLabelText('Motivo del rechazo'), { target: { value: 'El valor no coincide' } });
      expect(confirmar.disabled).toBe(false);
      fireEvent.click(confirmar);
      const rechazada = usePropertyStore.getState().properties[0];
      expect(rechazada.publicationStatus).toBe('rechazada');
      expect(rechazada.rejectionReason).toBe('El valor no coincide');
      expect(screen.queryByLabelText('Motivo del rechazo')).toBeNull();
    });

    it('cancelar el rechazo no cambia el estado', () => {
      usePropertyStore.setState({ properties: [conEstado('e', 'Esperando', 'en_revision')] });
      render(<PropertiesTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(estado('e')).toBe('en_revision');
    });

    it('un borrador se puede aprobar directo, sin pasar por revisión', () => {
      usePropertyStore.setState({ properties: [conEstado('b', 'Borrador', 'borrador')] });
      render(<PropertiesTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Aprobar y publicar' }));
      expect(estado('b')).toBe('publicada');
    });
  });

  describe('agente en una corredora que publica directo', () => {
    it('actúa como publicador: crea publicado y no necesita aprobación', () => {
      entrar('agente', 'directa');
      render(<PropertiesTab />);
      expect(screen.getByRole('button', { name: 'Publicar Nueva Propiedad' })).toBeTruthy();
      abrirNueva();
      llenarFormulario('Directa del agente', 'Calle 5');
      guardar(/Crear Propiedad/);
      expect(usePropertyStore.getState().properties.find((p) => p.title === 'Directa del agente')?.publicationStatus).toBe('publicada');
    });
  });
});
