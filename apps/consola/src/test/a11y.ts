import axe from 'axe-core';

// Revisión de accesibilidad con axe-core sobre un trozo de página (H-024). En jsdom no hay diseño real, así que
// se desactivan las reglas que dependen de él (contraste de color, regiones de página); lo demás sí se revisa.
export async function accessibilityViolations(container: Element): Promise<string[]> {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`);
}
