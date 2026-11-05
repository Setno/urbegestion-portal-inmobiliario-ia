-- H-063: create_site_lead ya no se puede llamar con la clave pública (anon) ni con una sesión iniciada.
-- La clave pública está a la vista de cualquiera, así que quien la tomara podía saltarse el formulario y llamar a la
-- función directo (spam de leads y de avisos). Desde ahora solo la llaman los servidores que tienen la clave de
-- servicio: el sitio (Next.js) y `api/crear-lead` de la consola, que además limitan por dirección IP.
-- Los miembros de una corredora siguen creando leads con un insert directo, que la base ya limita a su corredora.
-- No cambia la lógica de la función: solo quién puede ejecutarla.

revoke all on function public.create_site_lead(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_site_lead(uuid, jsonb) to service_role;
