import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'anuncios');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `anuncio_${Date.now()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (tipos.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

export const crearAnuncio = async (req: Request, res: Response) => {
  const { titulo, contenido } = req.body;
  const imagen = req.file ? `/uploads/anuncios/${req.file.filename}` : null;
  try {
    const anuncio = await prisma.anuncio.create({
      data: { titulo, contenido, imagen }
    });
    res.json({ message: 'Anuncio creado', anuncio });
  } catch (error) {
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
    res.status(500).json({ error: 'Error al listar anuncios' });
  }
};

export const actualizarAnuncio = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, contenido, activo } = req.body;
  const imagen = req.file ? `/uploads/anuncios/${req.file.filename}` : undefined;
  try {
    const data: any = { titulo, contenido, activo: activo === 'true' || activo === true };
    if (imagen) data.imagen = imagen;
    const anuncio = await prisma.anuncio.update({
      where: { id: Number(id) },
      data
    });
    res.json({ message: 'Anuncio actualizado', anuncio });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar anuncio' });
  }
};

export const eliminarAnuncio = async (req: Request, res: Response) => {
  try {
    await prisma.anuncio.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Anuncio eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar anuncio' });
  }
};