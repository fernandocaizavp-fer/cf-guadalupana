import prisma from './prisma';

/**
 * Devuelve la configuración global (fila única id = 1). Si no existe todavía,
 * la crea con los valores por defecto del esquema. Así el resto del sistema
 * siempre obtiene una configuración válida sin depender de un seed previo.
 */
export async function getConfiguracion() {
  return prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 }
  });
}

type RangoNota = { notaMinima: number; notaMaxima: number };

/** True si el valor está dentro del rango configurado [notaMinima, notaMaxima]. */
export function notaEnRango(valor: number, config: RangoNota): boolean {
  return valor >= config.notaMinima && valor <= config.notaMaxima;
}

/**
 * Verifica que todos los valores no nulos de una lista estén dentro del rango.
 * Devuelve el primer valor inválido encontrado, o null si todos son válidos.
 */
export function primeraNotaFueraDeRango(
  valores: Array<number | null | undefined>,
  config: RangoNota
): number | null {
  for (const v of valores) {
    if (v === null || v === undefined) continue;
    if (!notaEnRango(v, config)) return v;
  }
  return null;
}

const UN_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * True si la fecha actual no ha pasado el final del día de `hasta`.
 * Se suma un día para que la fecha límite sea INCLUSIVA: "hasta el 3" cubre
 * todo el día 3 (hasta las 00:00 del día 4).
 */
export function vigenteHasta(hasta: Date | null | undefined): boolean {
  if (!hasta) return false;
  return Date.now() < new Date(hasta).getTime() + UN_DIA_MS;
}

/**
 * Indica si la ventana general de supletorios está abierta ahora mismo,
 * controlada SOLO por las fechas. Sin un período definido (ambas fechas en
 * null) se considera cerrada. La fecha de fin es inclusiva (todo ese día).
 */
export function ventanaSupletorioAbierta(config: {
  supletorioInicio: Date | null;
  supletorioFin: Date | null;
}): boolean {
  if (!config.supletorioInicio && !config.supletorioFin) return false;
  const ahora = new Date();
  if (config.supletorioInicio && ahora < config.supletorioInicio) return false;
  if (config.supletorioFin && !vigenteHasta(config.supletorioFin)) return false;
  return true;
}
