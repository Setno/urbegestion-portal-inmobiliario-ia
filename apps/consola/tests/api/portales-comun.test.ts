import { describe, it, expect } from 'vitest';
import { validationAllowed } from '../../api/portales/_comun';

describe('validationAllowed: "Probar sin publicar" solo fuera de producción', () => {
  it.each(['preview', 'development'])('permite %s', (env) => expect(validationAllowed(env)).toBe(true));
  it.each(['production', '', undefined, 'Preview', 'staging'])('rechaza %s (producción y cualquier valor desconocido)', (env) =>
    expect(validationAllowed(env)).toBe(false),
  );
});
