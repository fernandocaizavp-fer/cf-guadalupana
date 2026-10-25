/**
 * Validación de la identificación del estudiante (cédula ecuatoriana o pasaporte).
 * Espejo en frontend/src/app/services/cedula-util.ts: mantener ambos iguales.
 *
 * Cédula (solo dígitos) — algoritmo del Registro Civil, módulo 10:
 *  1. Exactamente 10 dígitos.
 *  2. Dígitos 1-2 = código de provincia: 01..24, o 30 (ecuatorianos registrados
 *     en el exterior). Un "72" pasaría el módulo 10 pero no existe esa provincia.
 *  3. Dígito 3 entre 0 y 5 (persona natural; 6 y 9 son RUC de entidades).
 *  4. Dígitos 1-9 se multiplican por 2,1,2,1,...; si un producto pasa de 9 se le
 *     resta 9; el verificador es (10 - suma % 10) % 10 y debe igualar al dígito 10.
 *
 * Pasaporte (contiene letras): 5 a 10 caracteres alfanuméricos (columna VarChar(10)).
 * Un valor solo numérico SIEMPRE se trata como cédula, para que no se pueda
 * colar un número inventado haciéndolo pasar por pasaporte.
 */

const COEFICIENTES = [2, 1, 2, 1, 2, 1, 2, 1, 2];

/** Devuelve null si la cédula es válida, o el motivo (corto) si no lo es. */
export function motivoCedulaInvalida(cedula: string): string | null {
  if (!/^\d{10}$/.test(cedula)) return 'debe tener 10 dígitos';

  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return `el código de provincia ${cedula.slice(0, 2)} no existe`;
  }

  if (Number(cedula[2]) > 5) return 'el tercer dígito debe estar entre 0 y 5';

  const suma = COEFICIENTES.reduce((acc, coef, i) => {
    const producto = Number(cedula[i]) * coef;
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  const verificador = (10 - (suma % 10)) % 10;
  if (verificador !== Number(cedula[9])) return 'el dígito verificador no coincide';

  return null;
}

/**
 * Valida cédula o pasaporte. Devuelve null si es válida, o un mensaje completo
 * listo para mostrar al usuario.
 */
export function validarIdentificacion(valor: unknown): string | null {
  const id = String(valor ?? '').trim();
  if (!id) return 'La cédula es obligatoria';

  if (/^\d+$/.test(id)) {
    const motivo = motivoCedulaInvalida(id);
    return motivo ? `Cédula inválida: ${motivo}` : null;
  }

  if (!/^[A-Za-z0-9]{5,10}$/.test(id)) {
    return 'Pasaporte inválido: debe tener entre 5 y 10 letras o números, sin espacios ni símbolos';
  }
  return null;
}
