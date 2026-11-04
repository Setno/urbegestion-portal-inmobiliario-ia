// Aviso de privacidad de los formularios (H-012, Ley 21.719). Lo usan la consola y el sitio, para que todos muestren lo mismo.

// Cambia cuando cambia el texto del aviso, para saber qué aviso vio cada contacto al enviar sus datos.
export const NOTICE_VERSION = '2026-11-04';

export const NOTICE_PURPOSE = 'contacto_por_consulta';

export const NOTICE_TEXT =
  'Al enviar este formulario, la corredora usará tu nombre, teléfono y correo solo para responder esta consulta (visita, valoración o información de propiedades).';

export const NOTICE_DETAILS = [
  'Qué datos: los que escribes en este formulario (nombre, teléfono, correo y lo que cuentes de la propiedad). Si llegaste desde un anuncio o enlace, también se guarda cuál (fuente y campaña) para saber qué publicidad funciona.',
  'Para qué: responder tu consulta y coordinar la visita o la valoración. No se usan para otra cosa sin tu permiso.',
  'Quién los ve: la corredora y sus agentes. No se venden ni se ceden a terceros ajenos al servicio.',
  'Tus derechos: puedes pedir acceso, corrección o eliminación de tus datos, y oponerte al uso, escribiendo a la corredora.',
];

// Deja constancia de qué aviso se mostró y cuándo se envió el formulario.
export const buildPrivacyNotice = (now: Date = new Date()) => ({
  shownAt: now.toISOString(),
  version: NOTICE_VERSION,
  purpose: NOTICE_PURPOSE,
});
