// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { FormularioVisita } from './FormularioVisita';
import { FormularioTasacion } from './FormularioTasacion';

// Línea base de accesibilidad de los formularios públicos del sitio (H-024): sin infracciones serias ni críticas.
// En jsdom no hay diseño real, así que no se revisa el contraste de color.
async function infracciones(container: Element): Promise<string[]> {
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`);
}

describe('accesibilidad de los formularios del sitio (H-024)', () => {
  afterEach(cleanup);

  it('formulario de visita', async () => {
    const { container } = render(<FormularioVisita propiedadId="p1" enviarVisita={vi.fn()} />);
    expect(await infracciones(container)).toEqual([]);
  });

  it('formulario de tasación', async () => {
    const { container } = render(<FormularioTasacion enviarTasacion={vi.fn()} />);
    expect(await infracciones(container)).toEqual([]);
  });
});
