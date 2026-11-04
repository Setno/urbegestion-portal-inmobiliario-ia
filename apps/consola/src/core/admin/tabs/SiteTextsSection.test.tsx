import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { NEUTRAL_CONTENT, type SiteContent } from '@portal/sitio-datos';
import { SiteTextsSection } from './SiteTextsSection';
import { useBrandStore } from '../../brand/useBrandStore';

const textos: SiteContent = {
  ...NEUTRAL_CONTENT,
  hero: { ...NEUTRAL_CONTENT.hero, badge: 'Desde 2010' },
  about: { ...NEUTRAL_CONTENT.about, title: 'Quiénes somos', paragraphs: ['Uno.', 'Dos.'] },
  testimonials: { ...NEUTRAL_CONTENT.testimonials, items: [{ name: 'Ana Pérez', role: 'Compró', photo: '', initials: 'AP', quote: 'Excelente', stars: 5 }] },
  footer: { ...NEUTRAL_CONTENT.footer, coverageAreas: ['Viña del Mar', 'Reñaca'] },
};

const guardar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar textos' }));

describe('SiteTextsSection (editor de textos del sitio, H-032)', () => {
  const saveContent = vi.fn();

  beforeEach(() => {
    saveContent.mockReset().mockImplementation(async (content: SiteContent) => {
      useBrandStore.setState({ content });
      return { ok: true };
    });
    useBrandStore.setState({ content: textos, saveContent });
  });

  afterEach(() => cleanup());

  it('muestra los textos actuales de la corredora', () => {
    render(<SiteTextsSection />);
    expect((screen.getByLabelText('Etiqueta sobre el título') as HTMLInputElement).value).toBe('Desde 2010');
    expect((screen.getByLabelText('Párrafos') as HTMLTextAreaElement).value).toBe('Uno.\n\nDos.');
    expect((screen.getByLabelText('Nombre del testimonio 1') as HTMLInputElement).value).toBe('Ana Pérez');
    expect((screen.getByLabelText('Zonas donde trabajas (separadas por comas)') as HTMLInputElement).value).toBe('Viña del Mar, Reñaca');
  });

  it('guarda los cambios: párrafos separados por línea en blanco y zonas por comas', async () => {
    render(<SiteTextsSection />);
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Tu casa en la costa' } });
    fireEvent.change(screen.getByLabelText('Párrafos'), { target: { value: 'Primero.\n\n\nSegundo.\n' } });
    fireEvent.change(screen.getByLabelText('Zonas donde trabajas (separadas por comas)'), { target: { value: 'Concón, , Quintero' } });
    guardar();
    await waitFor(() => expect(saveContent).toHaveBeenCalled());
    const enviado = saveContent.mock.calls[0][0] as SiteContent;
    expect(enviado.hero.headline).toBe('Tu casa en la costa');
    expect(enviado.about.paragraphs).toEqual(['Primero.', 'Segundo.']);
    expect(enviado.footer.coverageAreas).toEqual(['Concón', 'Quintero']);
    expect(await screen.findByText(/Textos guardados/)).toBeTruthy();
  });

  it('agrega y quita testimonios', async () => {
    render(<SiteTextsSection />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar testimonio/ }));
    fireEvent.change(screen.getByLabelText('Nombre del testimonio 2'), { target: { value: 'Luis Soto' } });
    fireEvent.change(screen.getByLabelText('Comentario del testimonio 2'), { target: { value: 'Muy atentos' } });
    fireEvent.change(screen.getByLabelText('Estrellas del testimonio 2'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Quitar el testimonio 1' }));
    guardar();
    await waitFor(() => expect(saveContent).toHaveBeenCalled());
    const enviado = saveContent.mock.calls[0][0] as SiteContent;
    expect(enviado.testimonials.items).toEqual([{ name: 'Luis Soto', role: '', photo: '', initials: '', quote: 'Muy atentos', stars: 4 }]);
  });

  it('agrega y quita puntos destacados de "Sobre nosotros"', async () => {
    render(<SiteTextsSection />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar punto destacado/ }));
    fireEvent.change(screen.getByLabelText('Título del punto 1'), { target: { value: 'Tasación' } });
    fireEvent.change(screen.getByLabelText('Texto del punto 1'), { target: { value: 'Gratis' } });
    guardar();
    await waitFor(() => expect(saveContent).toHaveBeenCalled());
    expect((saveContent.mock.calls[0][0] as SiteContent).about.highlights).toEqual([{ title: 'Tasación', text: 'Gratis' }]);
  });

  it('si la base rechaza el cambio, lo explica', async () => {
    saveContent.mockResolvedValue({ ok: false, error: 'permiso' });
    render(<SiteTextsSection />);
    guardar();
    expect(await screen.findByText(/no puede cambiar los textos/)).toBeTruthy();
  });
});
