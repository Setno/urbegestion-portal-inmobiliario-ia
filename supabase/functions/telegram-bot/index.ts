// H-054: recibe los mensajes del bot de Telegram y conecta el chat de la corredora con su código de un solo uso.
import { atenderTelegram } from '../_compartido/avisos.ts';

declare const Deno: { serve: (handler: (request: Request) => Promise<Response>) => void; env: { toObject: () => Record<string, string> } };

Deno.serve((request) => atenderTelegram(request, Deno.env.toObject(), fetch));
