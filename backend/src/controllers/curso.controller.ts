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
  'Legislación'
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
      // Solo cuenta matrículas activas: las archivadas (activo=false) no suman.
      include: { materias: true, _count: { select: { matriculas: { where: { activo: true } } } } }
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
      include: {
        materias: {
          include: {
            profesor: { select: { id: true, nombre: true, apellido: true, cedula: true } },
            profesorPrincipal: { select: { id: true, nombre: true, apellido: true, cedula: true } }
          },
          orderBy: { id: 'asc' }
        },
        // Solo matrículas activas: las archivadas (activo=false) quedan ocultas.
        matriculas: { where: { activo: true } }
      }
    });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener curso' });
  }
};

export const actualizarCurso = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ramaArtesanal, anioFormativo, fechaInicio, fechaFin } = req.body;
  try {
    const data: any = {};
    if (ramaArtesanal !== undefined) data.ramaArtesanal = ramaArtesanal;
    if (anioFormativo !== undefined) data.anioFormativo = anioFormativo;
    if (fechaInicio) data.fechaInicio = new Date(fechaInicio);
    if (fechaFin) data.fechaFin = new Date(fechaFin);

    const curso = await prisma.curso.update({
      where: { id: Number(id) },
      data
    });
    res.json({ message: 'Curso actualizado', curso });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar curso' });
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

// Agregar submateria a Práctica o Teoría
export const agregarSubmateria = async (req: Request, res: Response) => {
  const { cursoId, nombre } = req.body;
  try {
    const [practica, teoria] = await prisma.$transaction([
      prisma.materia.create({
        data: { nombre, cursoId: Number(cursoId), esSubmateria: true, materiaParent: 'Práctica' }
      }),
      prisma.materia.create({
        data: { nombre, cursoId: Number(cursoId), esSubmateria: true, materiaParent: 'Teoría' }
      })
    ]);
    res.json({ message: 'Submateria creada en Práctica y Teoría', practica, teoria });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear submateria' });
  }
};

// Eliminar submateria
export const eliminarSubmateria = async (req: Request, res: Response) => {
  try {
    const materia = await prisma.materia.findUnique({
      where: { id: Number(req.params.id) }
    });
    if (!materia?.esSubmateria) {
      return res.status(400).json({ error: 'Solo se pueden eliminar submaterias' });
    }
    await prisma.materia.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Submateria eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar submateria' });
  }
};

// Obtener submaterias de un curso por parent
export const getSubmaterias = async (req: Request, res: Response) => {
  const { cursoId, parent } = req.params;
  try {
    const submaterias = await prisma.materia.findMany({
      where: {
        cursoId: Number(cursoId),
        esSubmateria: true,
        materiaParent: String(parent)
      },
      include: {
        profesor: { select: { id: true, nombre: true, apellido: true, cedula: true } }
      },
      orderBy: { id: 'asc' }
    });
    res.json(submaterias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener submaterias' });
  }
};