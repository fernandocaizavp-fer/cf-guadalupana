/**
 * Envío de correos desde el servidor mediante la API REST de EmailJS.
 *
 * El código de recuperación de contraseña se envía desde aquí y nunca viaja al
 * navegador: así solo lo recibe el dueño del correo.
 *
 * Variables de entorno (Railway):
 *   EMAILJS_SERVICE_ID   servicio de EmailJS (por defecto, el que ya usaba el frontend)
 *   EMAILJS_TEMPLATE_ID  plantilla del correo de recuperación (ídem)
 *   EMAILJS_PUBLIC_KEY   clave pública de la cuenta (ídem)
 *   EMAILJS_PRIVATE_KEY  clave privada (obligatoria). En el panel de EmailJS debe
 *                        estar activado el acceso a la API para aplicaciones que
 *                        no son navegador (Account → Security).
 */
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

export interface DatosCodigoRecuperacion {
  correo: string;
  nombre: string;
  codigo: string;
}

export const enviarCodigoRecuperacion = async (datos: DatosCodigoRecuperacion): Promise<void> => {
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Falta la variable de entorno EMAILJS_PRIVATE_KEY');
  }

  const respuesta = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID || 'service_z7zewvc',
      template_id: process.env.EMAILJS_TEMPLATE_ID || 'template_s3ktec8',
      user_id: process.env.EMAILJS_PUBLIC_KEY || 'ENzKszL5IxzmsSt26',
      accessToken: privateKey,
      // Mismos parámetros que usa la plantilla de EmailJS
      template_params: { correo: datos.correo, nombre: datos.nombre, codigo: datos.codigo }
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`EmailJS respondió ${respuesta.status}: ${detalle}`);
  }
};
