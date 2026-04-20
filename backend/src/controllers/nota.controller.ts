import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Obtener notas de un curso con todos sus estudiantes
export const getNotasCurso = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  try {
    const matriculas = await prisma.matricula.findMany({
      where: { cursoId: Number(cursoId) },
      include: {
        notas: {
          include: { materia: true }
        }
      },
      orderBy: { apellidos: 'asc' }
    });

    const materias = await prisma.materia.findMany({
      where: { cursoId: Number(cursoId) },
      orderBy: { id: 'asc' }
    });

    res.json({ matriculas, materias });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

// Guardar o actualizar una nota
export const guardarNota = async (req: Request, res: Response) => {
  const { matriculaId, materiaId, valor } = req.body;
  try {
    const nota = await prisma.nota.upsert({
      where: {
        materiaId_matriculaId: {
          materiaId: Number(materiaId),
          matriculaId: Number(matriculaId)
        }
      },
      update: { valor: Number(valor) },
      create: {
        materiaId: Number(materiaId),
        matriculaId: Number(matriculaId),
        valor: Number(valor)
      }
    });
    res.json({ message: 'Nota guardada', nota });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar nota' });
  }
};

// Guardar múltiples notas a la vez
export const guardarNotasMasivo = async (req: Request, res: Response) => {
  const { notas } = req.body;
  // notas: [{ matriculaId, materiaId, valor }]
  try {
    const resultados = await Promise.all(
      notas.map((n: any) =>
        prisma.nota.upsert({
          where: {
            materiaId_matriculaId: {
              materiaId: Number(n.materiaId),
              matriculaId: Number(n.matriculaId)
            }
          },
          update: { valor: Number(n.valor) },
          create: {
            materiaId: Number(n.materiaId),
            matriculaId: Number(n.matriculaId),
            valor: Number(n.valor)
          }
        })
      )
    );
    res.json({ message: 'Notas guardadas', total: resultados.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar notas' });
  }
};

// Descargar AL14 Word
export const descargarAL14 = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { lugarFecha } = req.query;
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: Number(cursoId) },
      include: {
        materias: { orderBy: { id: 'asc' } },
        matriculas: {
          include: {
            notas: { include: { materia: true } }
          },
          orderBy: { apellidos: 'asc' }
        }
      }
    });

    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const fs = require('fs');
    const path = require('path');
    const PizZip = require('pizzip');
    const Docxtemplater = require('docxtemplater');

    const templatePath = path.join(process.cwd(), 'templates', 'AL14CUADRODECALIFICACIONES.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // Armar datos de estudiantes
    const estudiantes = curso.matriculas.map((m, index) => {
      const getNota = (nombreMateria: string) => {
        const nota = m.notas.find(n =>
          n.materia.nombre.toLowerCase().includes(nombreMateria.toLowerCase())
        );
        return nota ? String(nota.valor) : '';
      };

      const todasNotas = m.notas.map(n => n.valor);
      const promedio = todasNotas.length > 0
        ? (todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length).toFixed(2)
        : '';

      return {
        num: String(index + 1),
        nombres: `${m.apellidos} ${m.nombres}`,
        teoria: getNota('Teoría'),
        practica: getNota('Práctica'),
        administracion: getNota('Administración'),
        contabilidad: getNota('Contabilidad'),
        tics: getNota('TICs'),
        ingles: getNota('Inglés'),
        desarrollo: getNota('Desarrollo Humano'),
        legislacion: getNota('Legislación'),
        disciplina: getNota('Disciplina'),
        promedio,
        observaciones: ''
      };
    });

    const fechaInicio = curso.fechaInicio.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }).toUpperCase();
    const fechaFin = curso.fechaFin.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }).toUpperCase();

    doc.render({
      ramaArtesanal: curso.ramaArtesanal.toUpperCase(),
      fechaInicio,
      fechaFin,
      lugarFecha: lugarFecha || '',
      estudiantes
    });

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', `attachment; filename=AL14_${curso.ramaArtesanal}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar documento' });
  }
};