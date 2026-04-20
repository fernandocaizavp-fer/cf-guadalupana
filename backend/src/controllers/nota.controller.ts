import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const formatearNota = (valor: number | string): string => {
  if (valor === '' || valor === null || valor === undefined) return '';
  const num = Number(valor);
  if (isNaN(num)) return '';
  return num % 1 === 0 ? String(num) : num.toFixed(1);
};

export const descargarAL14 = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { lugarFecha, semestre } = req.query;
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: Number(cursoId) },
      include: {
        materias: {
          orderBy: { id: 'asc' },
          include: {
            tareas: {
              where: semestre ? { semestre: Number(semestre) } : undefined,
              orderBy: { fecha: 'asc' }
            }
          }
        },
        matriculas: {
          include: {
            notasTarea: {
              include: {
                tarea: { include: { materia: true } }
              },
              where: semestre ? {
                tarea: { semestre: Number(semestre) }
              } : undefined
            }
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

    const estudiantes = curso.matriculas.map((m, index) => {
      const getPromedioPorMateria = (nombreMateria: string): string => {
        const notasMateria = m.notasTarea.filter(n =>
          n.tarea.materia.nombre.toLowerCase().includes(nombreMateria.toLowerCase()) &&
          n.valor !== null
        );
        if (notasMateria.length === 0) return '';
        const suma = notasMateria.reduce((a, b) => a + (b.valor || 0), 0);
        return formatearNota(suma / notasMateria.length);
      };

      const todasNotas = m.notasTarea
        .filter(n => n.valor !== null)
        .map(n => n.valor || 0);
      const promedioGeneral = todasNotas.length > 0
        ? formatearNota(todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length)
        : '';

      return {
        num: String(index + 1),
        nombres: `${m.apellidos} ${m.nombres}`,
        teoria: getPromedioPorMateria('Teoría'),
        practica: getPromedioPorMateria('Práctica'),
        administracion: getPromedioPorMateria('Administración'),
        contabilidad: getPromedioPorMateria('Contabilidad'),
        tics: getPromedioPorMateria('TICs'),
        ingles: getPromedioPorMateria('Inglés'),
        desarrollo: getPromedioPorMateria('Desarrollo Humano'),
        legislacion: getPromedioPorMateria('Legislación'),
        disciplina: getPromedioPorMateria('Disciplina'),
        promedio: promedioGeneral,
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
    const semestreLabel = semestre ? `_semestre${semestre}` : '';
    res.setHeader('Content-Disposition', `attachment; filename=AL14_${curso.ramaArtesanal}${semestreLabel}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar documento' });
  }
};