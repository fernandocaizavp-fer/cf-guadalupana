import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Límite de negocio: 10 MB por archivo.
export const LIMITE_BYTES = 10 * 1024 * 1024;
// Tope duro de seguridad en multer (evita llenar memoria con archivos enormes).
const TOPE_MULTER = 50 * 1024 * 1024;

// Almacenamiento en memoria: el archivo se sube luego a Cloudinary, no a disco.
// Sin fileFilter → se permite cualquier tipo de archivo. Subida múltiple.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TOPE_MULTER }
});

export const subirArchivos = upload.array('archivos');

// Multer decodifica el nombre del archivo como latin1; lo reinterpretamos como
// UTF-8 para conservar bien las tildes y la ñ (p. ej. "rúbrica evaluación").
// NFC une la letra y su tilde en un solo carácter: los archivos que vienen de
// macOS o del celular traen "e" + "´" por separado y se ven desalineados.
export function nombreUtf8(nombre: string): string {
  return Buffer.from(nombre, 'latin1').toString('utf8').normalize('NFC');
}

/**
 * Valida la regla de 10 MB por archivo y devuelve un mensaje claro con el
 * nombre del archivo que se pasa. Llamar después de `subirArchivos`.
 * Devuelve true si todo está bien; si no, responde el error y devuelve false.
 */
export function validarTamano(req: Request, res: Response): boolean {
  const archivos = (req.files as Express.Multer.File[]) || [];
  for (const archivo of archivos) {
    if (archivo.size > LIMITE_BYTES) {
      res.status(400).json({
        error: `El archivo ${nombreUtf8(archivo.originalname)} supera el tamaño máximo de 10 MB`
      });
      return false;
    }
  }
  return true;
}

// Manejo del error de multer cuando se supera el tope duro de seguridad.
export function manejarErrorMulter(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Un archivo supera el tamaño máximo permitido' });
    }
    return res.status(400).json({ error: 'Error al subir el archivo' });
  }
  next(err);
}
