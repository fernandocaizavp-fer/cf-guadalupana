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
          include: { curso: true }
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
  const sem = semestre ? Number(semestre) : undefined;

  try {
    // Solo materias principales (no submaterias)
    const materiasPrincipales = await prisma.materia.findMany({
      where: { cursoId: Number(cursoId), esSubmateria: false },
      orderBy: { id: 'asc' }
    });

    // Todas las materias incluyendo submaterias (para calcular promedios de Práctica/Teoría)
    const todasMaterias = await prisma.materia.findMany({
      where: { cursoId: Number(cursoId) },
      select: { id: true, nombre: true, esSubmateria: true, materiaParent: true }
    });

    // Matrículas con notas de tareas y disciplina
    const matriculas = await prisma.matricula.findMany({
      where: { cursoId: Number(cursoId) },
      include: {
        notasTarea: {
          include: {
            tarea: {
              include: { materia: true }
            }
          },
          where: sem ? { tarea: { semestre: sem } } : undefined
        },
        notasDisciplina: {
          where: sem ? { semestre: sem } : undefined,
          include: { materia: { select: { nombre: true, esSubmateria: true, materiaParent: true } } }
        }
      },
      orderBy: { apellidos: 'asc' }
    });

    res.json({ matriculas, materias: materiasPrincipales, todasMaterias });
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