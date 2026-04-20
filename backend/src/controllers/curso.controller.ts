import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const MATERIAS_DEFAULT = [
  'Teoría',
  'Práctica',
  'Administración de Talleres',
  'Contabilidad',
  'TICs',
  'Inglés Técnico',
  'Desarrollo Humano y Ética Profesional',
  'Elaboración de Proyectos Productivos y/o Servicios',
  'Legislación',
  'Promedio General'
];

export const crearCurso = async (req: Request, res: Response) => {
  const { ramaArtesanal, anioFormativo, fechaInicio, fechaFin } = req.body;
  try {
    const curso = await prisma.curso.create({
      data: {
        ramaArtesanal,
        anioFormativo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        materias: {
          create: MATERIAS_DEFAULT.map(nombre => ({ nombre }))
        }
      },
      include: { materias: true }
    });
    res.json({ message: 'Curso creado', curso });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear curso' });
  }
};

export const listarCursos = async (req: Request, res: Response) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: { materias: true, _count: { select: { matriculas: true } } }
    });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar cursos' });
  }
};

export const obtenerCurso = async (req: Request, res: Response) => {
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: Number(req.params.id) },
      include: { materias: true, matriculas: true }
    });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener curso' });
  }
};

export const eliminarCurso = async (req: Request, res: Response) => {
  try {
    await prisma.curso.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Curso eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar curso' });
  }
};