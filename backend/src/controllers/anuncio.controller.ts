import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import multer from 'multer';
import { subirArchivo } from '../lib/cloudinary';

// La imagen del anuncio se sube a Cloudinary (no a disco: Railway borra los
// archivos en cada redeploy). Se guarda en memoria y luego se sube.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

export const crearAnuncio = async (req: any, res: Response) => {
  const { titulo, contenido } = req.body;
  try {
    // Sube la imagen a Cloudinary y guarda la URL completa (permanente).
    const imagen = req.file
      ? (await subirArchivo(req.file.buffer, req.file.originalname, 'cf_guadalupana/anuncios')).url
      : null;
    // El autor se deriva del usuario autenticado (token), no del body.
    // El JWT solo trae { id, rol }, por eso consultamos el nombre.
    const autorRol = req.usuario?.rol ?? null;
    const autor = await prisma.usuario.findUnique({
      where: { id: req.usuario?.id },
      select: { nombre: true, apellido: true }
    });
    const autorNombre = autor ? `${autor.nombre} ${autor.apellido}` : null;

    const anuncio = await prisma.anuncio.create({
      data: { titulo, contenido, imagen, autorRol, autorNombre }
    });
    res.json({ message: 'Anuncio creado', anuncio });
  } catch (error) {
    console.error('[anuncio] crearAnuncio falló:', error);
    res.status(500).json({ error: 'Error al crear anuncio' });
  }
};

export const listarAnuncios = async (req: Request, res: Response) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(anuncios);
  } catch (error) {
    console.error('[anuncio] listarAnuncios falló:', error);
    res.status(500).json({ error: 'Error al listar anuncios' });
  }
};

export const listarTodosAnuncios = async (req: Request, res: Response) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(anuncios);
  } catch (error) {
    console.error('[anuncio] listarTodosAnuncios falló:', error);
    res.status(500).json({ error: 'Error al listar anuncios' });
  }
};

export const actualizarAnuncio = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, contenido, activo } = req.body;
  try {
    const data: any = { titulo, contenido, activo: activo === 'true' || activo === true };
    if (req.file) {
      data.imagen = (await subirArchivo(req.file.buffer, req.file.originalname, 'cf_guadalupana/anuncios')).url;
    }
    const anuncio = await prisma.anuncio.update({
      where: { id: Number(id) },
      data
    });
    res.json({ message: 'Anuncio actualizado', anuncio });
  } catch (error) {
    console.error('[anuncio] actualizarAnuncio falló:', error);
    res.status(500).json({ error: 'Error al actualizar anuncio' });
  }
};

export const eliminarAnuncio = async (req: Request, res: Response) => {
  try {
    await prisma.anuncio.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Anuncio eliminado' });
  } catch (error) {
    console.error('[anuncio] eliminarAnuncio falló:', error);
    res.status(500).json({ error: 'Error al eliminar anuncio' });
  }
};