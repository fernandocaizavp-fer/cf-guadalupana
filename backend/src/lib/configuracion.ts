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

/**
 * Indica si la ventana general de supletorios está abierta ahora mismo
 * (interruptor del admin activo y fecha actual dentro del rango configurado).
 */
export function ventanaSupletorioAbierta(config: {
  supletorioHabilitado: boolean;
  supletorioInicio: Date | null;
  supletorioFin: Date | null;
}): boolean {
  if (!config.supletorioHabilitado) return false;
  const ahora = new Date();
  if (config.supletorioInicio && ahora < config.supletorioInicio) return false;
  if (config.supletorioFin && ahora > config.supletorioFin) return false;
  return true;
}
