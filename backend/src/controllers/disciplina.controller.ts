import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Guardar nota de disciplina
export const guardarNotaDisciplina = async (req: Request, res: Response) => {
  const { matriculaId, materiaId, valor } = req.body;
  try {
    const nota = await prisma.notaDisciplina.upsert({
      where: {
        matriculaId_materiaId: {
          matriculaId: Number(matriculaId),
          materiaId: Number(materiaId)
        }
      },
      update: { valor: Number(valor) },
      create: {
        matriculaId: Number(matriculaId),
        materiaId: Number(materiaId),
        valor: Number(valor)
      }
    });
    res.json({ message: 'Nota de disciplina guardada', nota });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar nota de disciplina' });
  }
};

// Guardar notas de disciplina masivo
export const guardarNotasDisciplinaMasivo = async (req: Request, res: Response) => {
  const { notas } = req.body;
  try {
    const resultados = await Promise.all(
      notas.map((n: any) =>
        prisma.notaDisciplina.upsert({
          where: {
            matriculaId_materiaId: {
              matriculaId: Number(n.matriculaId),
              materiaId: Number(n.materiaId)
            }
          },
          update: { valor: Number(n.valor) },
          create: {
            matriculaId: Number(n.matriculaId),
            materiaId: Number(n.materiaId),
            valor: Number(n.valor)
          }
        })
      )
    );
    res.json({ message: 'Notas guardadas', total: resultados.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar notas de disciplina' });
  }
};

// Obtener notas de disciplina por materia
export const getNotasDisciplinaPorMateria = async (req: Request, res: Response) => {
  const { materiaId } = req.params;
  try {
    const notas = await prisma.notaDisciplina.findMany({
      where: { materiaId: Number(materiaId) },
      include: {
        matricula: {
          select: { id: true, nombres: true, apellidos: true, cedula: true }
        }
      },
      orderBy: { matricula: { apellidos: 'asc' } }
    });
    res.json(notas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas de disciplina' });
  }
};

export const getEstudiantesPorMateria = async (req: Request, res: Response) => {
  const { materiaId } = req.params;
  try {
    const materia = await prisma.materia.findUnique({
      where: { id: Number(materiaId) },
      include: {
        curso: {
          include: {
            matriculas: {
              orderBy: { apellidos: 'asc' }
            }
          }
        }
      }
    });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json({
      materia: { id: materia.id, nombre: materia.nombre },
      matriculas: materia.curso.matriculas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};


// Obtener notas de disciplina por curso
export const getNotasDisciplinaPorCurso = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  try {
    const matriculas = await prisma.matricula.findMany({
      where: { cursoId: Number(cursoId) },
      include: {
        notasDisciplina: true
      },
      orderBy: { apellidos: 'asc' }
    });

    const resumen = matriculas.map(m => {
      const notas = m.notasDisciplina.filter(n => n.valor !== null);
      const promedio = notas.length > 0
        ? notas.reduce((a, b) => a + b.valor, 0) / notas.length
        : null;
      return {
        matriculaId: m.id,
        nombres: m.nombres,
        apellidos: m.apellidos,
        promedio: promedio !== null
          ? (promedio % 1 === 0 ? String(promedio) : promedio.toFixed(1))
          : '-'
      };
    });

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas de disciplina' });
  }
};