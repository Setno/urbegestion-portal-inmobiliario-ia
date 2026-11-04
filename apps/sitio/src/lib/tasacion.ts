// Lo que comparten el formulario de tasación (navegador) y el envío (servidor).

export const OPERACIONES_TASACION = [
  { valor: 'venta', texto: 'Vender' },
  { valor: 'arriendo', texto: 'Arrendar' },
] as const;

export const TIPOS_TASACION = [
  { valor: 'casa', texto: 'Casa' },
  { valor: 'departamento', texto: 'Departamento' },
  { valor: 'parcela_agricola', texto: 'Parcela o terreno agrícola' },
  { valor: 'oficina_comercial', texto: 'Oficina o local comercial' },
] as const;

export interface DatosTasacion {
  operacion: 'venta' | 'arriendo';
  tipo: string;
  comuna: string;
  superficieM2: string;
  dormitorios: string; // vacío si no aplica (un terreno no tiene)
  nombre: string;
  telefono: string;
  correo: string;
  sitioWeb: string; // campo trampa: una persona nunca lo ve ni lo llena
}

export type ErrorTasacion =
  | 'operacion'
  | 'tipo'
  | 'comuna'
  | 'superficie'
  | 'dormitorios'
  | 'nombre'
  | 'telefono'
  | 'correo'
  | 'conexion';

export type ResultadoTasacion = { ok: true } | { ok: false; error: ErrorTasacion };

export type EnviarTasacion = (datos: DatosTasacion) => Promise<ResultadoTasacion>;
