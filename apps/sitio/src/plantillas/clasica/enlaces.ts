// Los contactos los escribe la corredora a mano: un dato inservible no debe crear un enlace roto (cadena vacía = sin enlace).

// wa.me exige solo dígitos.
export function enlaceWhatsapp(numero: string, mensaje: string): string {
  const digitos = numero.replace(/\D/g, '');
  return digitos ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}` : '';
}

export function enlaceTelefono(telefono: string): string {
  const limpio = telefono.replace(/[^\d+]/g, '');
  return /\d/.test(limpio) ? `tel:${limpio}` : '';
}

// Sin espacios ni signos de parámetros: un correo no puede agregar destinatarios ni texto al mensaje.
export function enlaceCorreo(correo: string): string {
  const limpio = correo.trim();
  return /^[^\s@?&]+@[^\s@?&]+$/.test(limpio) ? `mailto:${limpio}` : '';
}
