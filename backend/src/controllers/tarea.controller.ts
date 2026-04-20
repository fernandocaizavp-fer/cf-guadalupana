import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Crear tarea
export const crearTarea = async (req: Request, res: Response) => {
  const { nombre, descripcion, fecha, semestre, materiaId } = req.body;
  try {
    const tarea = await prisma.tarea.create({
      data: {
        nombre,
        descripcion,
        fecha: new Date(fecha),
        semestre: Number(semestre),
        materiaId: Number(materiaId)
      }
    });
    res.json({ message: 'Tarea creada', tarea });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

// Listar tareas de una materia por semestre
export const getTareasPorMateria = async (req: Request, res: Response) => {
  const { materiaId } = req.params;
  const { semestre } = req.query;
  try {
    const where: any = { materiaId: Number(materiaId) };
    if (semestre) where.semestre = Number(semestre);

    const tareas = await prisma.tarea.findMany({
      where,
      include: {
        materia: {
          include: { curso: true }  // ← agrega curso aquí
        },
        notas: {
          include: { matricula: true }
        }
      },
      orderBy: { fecha: 'asc' }
    });
    res.json(tareas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

// Guardar notas de una tarea masivamente
export const guardarNotasTarea = async (req: Request, res: Response) => {
  const { notas } = req.body;
  // notas: [{ matriculaId, tareaId, valor, observacion }]
  try {
    const resultados = await Promise.all(
      notas.map((n: any) =>
        prisma.notaTarea.upsert({
          where: {
            tareaId_matriculaId: {
              tareaId: Number(n.tareaId),
              matriculaId: Number(n.matriculaId)
            }
          },
          update: {
            valor: n.valor !== '' ? Number(n.valor) : null,
            observacion: n.observacion || null
          },
          create: {
            tareaId: Number(n.tareaId),
            matriculaId: Number(n.matriculaId),
            valor: n.valor !== '' ? Number(n.valor) : null,
            observacion: n.observacion || null
          }
        })
      )
    );
    res.json({ message: 'Notas guardadas', total: resultados.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar notas' });
  }
};

// Obtener notas de un curso por semestre (para el AL14)
export const getNotasCursoSemestre = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { semestre } = req.query;
  try {
    const matriculas = await prisma.matricula.findMany({
      where: { cursoId: Number(cursoId) },
      include: {
        notasTarea: {
          include: {
            tarea: {
              include: { materia: true }
            }
          },
          where: semestre ? {
            tarea: { semestre: Number(semestre) }
          } : undefined
        }
      },
      orderBy: { apellidos: 'asc' }
    });

    const materias = await prisma.materia.findMany({
      where: { cursoId: Number(cursoId) },
      include: {
        tareas: {
          where: semestre ? { semestre: Number(semestre) } : undefined,
          orderBy: { fecha: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });

    res.json({ matriculas, materias });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

// Eliminar tarea
export const eliminarTarea = async (req: Request, res: Response) => {
  try {
    await prisma.tarea.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};