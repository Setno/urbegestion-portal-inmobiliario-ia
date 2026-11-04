# Guía: avisos de leads nuevos (H-054)

Cuando alguien deja sus datos en el sitio, en la landing o en el chat, la corredora recibe un aviso. Hay tres canales:

| Canal | Qué necesita | Estado en desarrollo |
| --- | --- | --- |
| Aviso en vivo en el panel | Nada: funciona con el panel abierto | Listo |
| Correo | Una cuenta de Resend con su clave | Falta la clave |
| Telegram | Un bot de Telegram con su clave | Falta crear el bot |

## Cómo funciona
1. Al guardarse un lead, la base llama a la función `alerta-lead` de Supabase. La dirección de esa función está guardada en el Vault con el nombre `lead_alert_url`.
2. La función le pide a la base los datos del lead y a quién avisar (`claim_lead_alert`). La base entrega cada aviso **una sola vez**, así que llamar a la función a mano no sirve para mandar spam.
3. La función manda el correo (Resend) y el Telegram. Si un canal falla, el otro igual se envía, y el lead queda guardado de todas formas.

## Lo que hace la corredora (en el panel)
- En **Mi corredora → Avisos de leads nuevos** (solo el administrador) escribe hasta 3 correos y marca "Avisarme por correo".
- Para Telegram, toca **Conectar Telegram**. Se abre el bot y presiona **Iniciar**. Después vuelve al panel y toca **Ya lo conecté**. El enlace es de un solo uso y vence en 30 minutos.

## Lo que hace el dueño de la plataforma (una vez por ambiente)

### Correo con Resend (plan gratis: 3.000 correos al mes, 100 al día)
1. Crea una cuenta en resend.com y una clave (API key).
2. Para enviar a cualquier correo, Resend exige verificar un dominio propio (el de la plataforma). Mientras no lo tengas, solo puedes enviarte correos a ti mismo, desde `onboarding@resend.dev`.
3. En Supabase → Edge Functions → Secrets, carga:
   - `RESEND_API_KEY`: la clave de Resend.
   - `ALERTAS_REMITENTE`: por ejemplo `Avisos <avisos@tu-dominio.cl>` (o `onboarding@resend.dev` para probar).

### Telegram
1. En Telegram, habla con **@BotFather**, envía `/newbot` y sigue los pasos. Te entrega el nombre del bot y una clave (token).
2. En Supabase → Edge Functions → Secrets, carga:
   - `TELEGRAM_BOT_TOKEN`: la clave que te dio BotFather.
   - `TELEGRAM_WEBHOOK_SECRET`: una frase larga al azar que inventas tú (solo letras, números, `_` y `-`).
3. Registra el bot para que Telegram le avise a la función. Abre esta dirección en el navegador, reemplazando los dos valores:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<ref>.supabase.co/functions/v1/telegram-bot&secret_token=<SECRETO>`
4. En el proyecto de la consola en Vercel, carga `VITE_TELEGRAM_BOT` con el nombre del bot, sin `@`.

### Opcional
- `PANEL_URL` en los secretos de Supabase: la dirección del panel, para que el aviso traiga el botón "Abrir el panel".

### En un ambiente nuevo (por ejemplo, producción)
Aplicar las migraciones, desplegar las funciones `alerta-lead` y `telegram-bot` sin verificación de JWT, y registrar la dirección en el Vault:

```sql
select vault.create_secret('https://<ref>.supabase.co/functions/v1/alerta-lead', 'lead_alert_url', 'H-054: función que avisa los leads nuevos');
```

## Privacidad
El aviso lleva el nombre, el teléfono, el correo y la propiedad del interesado, porque la corredora los necesita para responder. Esos datos pasan por Resend o por Telegram. Conviene mencionarlo en la política de privacidad de la corredora junto con los otros servicios que usa.
