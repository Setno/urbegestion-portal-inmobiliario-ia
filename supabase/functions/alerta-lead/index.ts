// H-054: la base la llama al crearse un lead y avisa a la corredora por correo y Telegram. Lógica en _compartido/avisos.ts.
import { atenderAlerta } from '../_compartido/avisos.ts';

declare const Deno: { serve: (handler: (request: Request) => Promise<Response>) => void; env: { toObject: () => Record<string, string> } };

Deno.serve((request) => atenderAlerta(request, Deno.env.toObject(), fetch));
