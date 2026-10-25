/**
 * Longitud máxima de cada campo de la matrícula. Refleja los @db.VarChar(n)
 * de schema.prisma (Matricula, DatosPersonales/Familiares/AcademicosMatricula):
 * si cambia el esquema, actualizar aquí también.
 *
 * Sirve para avisar en el formulario ANTES de enviar. Sin esto, un texto largo
 * (típicamente autocompletado desde el Registro Civil) hacía fallar el INSERT
 * y el usuario solo veía "Error al crear matrícula".
 */
export const LIMITES_MATRICULA: Record<string, { max: number; etiqueta: string }> = {
  tomo: { max: 5, etiqueta: 'Tomo' },
  apellidos: { max: 100, etiqueta: 'Apellidos' },
  nombres: { max: 100, etiqueta: 'Nombres' },
  pais: { max: 30, etiqueta: 'País' },
  provincia: { max: 30, etiqueta: 'Provincia' },
  canton: { max: 30, etiqueta: 'Cantón' },
  parroquia: { max: 30, etiqueta: 'Parroquia' },
  ciudad: { max: 30, etiqueta: 'Ciudad' },
  nacionalidad: { max: 30, etiqueta: 'Nacionalidad' },
  telefono: { max: 15, etiqueta: 'Teléfono' },
  correoestudiante: { max: 100, etiqueta: 'Correo del estudiante' },
  calle: { max: 100, etiqueta: 'Calle' },
  num: { max: 10, etiqueta: 'Número de casa' },
  transversal: { max: 100, etiqueta: 'Transversal' },
  cursoanterior: { max: 100, etiqueta: 'Curso anterior' },
  centroformacionanterior: { max: 100, etiqueta: 'Centro de formación anterior' },
  conferidoPorA1: { max: 100, etiqueta: 'Conferido por (A.1)' },
  conferidoPorA2: { max: 100, etiqueta: 'Conferido por (A.2)' },
  especialidad: { max: 100, etiqueta: 'Especialidad' },
  unidadeducativa: { max: 100, etiqueta: 'Unidad educativa' },
  nombrepapa: { max: 100, etiqueta: 'Nombre del padre' },
  profesionpapa: { max: 60, etiqueta: 'Profesión del padre' },
  ocupacionpapa: { max: 60, etiqueta: 'Ocupación del padre' },
  nombremama: { max: 100, etiqueta: 'Nombre de la madre' },
  profesionmama: { max: 60, etiqueta: 'Profesión de la madre' },
  ocupacionmama: { max: 60, etiqueta: 'Ocupación de la madre' },
  nombrerepresentante: { max: 100, etiqueta: 'Nombre del representante' },
  ocupacionrepresentante: { max: 60, etiqueta: 'Ocupación del representante' },
  domiciliorepresentante: { max: 150, etiqueta: 'Domicilio del representante' },
  telefonorepresentante: { max: 15, etiqueta: 'Teléfono del representante' },
  lugarfechamatricula: { max: 100, etiqueta: 'Lugar y fecha de matrícula' },
  lugarfechacertificado: { max: 100, etiqueta: 'Lugar y fecha del certificado' }
};

/** Campos cuyo texto supera el máximo permitido, con un mensaje listo para mostrar. */
export function camposExcedidos(datos: any): string[] {
  return Object.entries(LIMITES_MATRICULA)
    .filter(([campo, l]) => String(datos?.[campo] ?? '').length > l.max)
    .map(([campo, l]) => `${l.etiqueta} (máx. ${l.max}, tiene ${String(datos[campo]).length})`);
}
