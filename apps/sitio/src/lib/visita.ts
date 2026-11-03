// Lo que comparten el formulario (navegador) y el envío (servidor).

export const HORARIOS = [
  { valor: '09:30', texto: 'Mañana (09:30)' },
  { valor: '11:30', texto: 'Mediodía (11:30)' },
  { valor: '15:30', texto: 'Tarde (15:30)' },
  { valor: '17:30', texto: 'Tarde (17:30)' },
];

// Sin preferencia hasta que la persona elija: el CRM no debe registrar un horario que nadie pidió.
export const HORARIO_INICIAL = '';

export interface DatosVisita {
  nombre: string;
  telefono: string;
  correo: string;
  fecha: string; // AAAA-MM-DD; vacía si la persona no eligió
  hora: string; // vacía si no tiene preferencia
  sitioWeb: string; // campo trampa: una persona nunca lo ve ni lo llena
}

export type ErrorVisita = 'nombre' | 'telefono' | 'correo' | 'fecha' | 'hora' | 'propiedad' | 'conexion';

export type ResultadoVisita = { ok: true } | { ok: false; error: ErrorVisita };

export type EnviarVisita = (propiedadId: string, datos: DatosVisita) => Promise<ResultadoVisita>;
