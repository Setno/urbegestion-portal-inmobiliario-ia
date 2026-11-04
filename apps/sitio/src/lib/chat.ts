// Lo que comparten el asistente de chat (navegador) y el envío del contacto (servidor).

export interface DatosChat {
  nombre: string;
  telefono: string;
  fecha: string; // AAAA-MM-DD; vacía si la persona no eligió
  hora: string; // vacía si no tiene preferencia
  consulta: string; // lo último que la persona le preguntó al asistente
  sitioWeb: string; // campo trampa: una persona nunca lo ve ni lo llena
}

export type ErrorChat = 'nombre' | 'telefono' | 'fecha' | 'hora' | 'conexion';

export type ResultadoChat = { ok: true } | { ok: false; error: ErrorChat };

export type EnviarContactoChat = (datos: DatosChat) => Promise<ResultadoChat>;
