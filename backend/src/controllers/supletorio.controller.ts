import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const fmt = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined) return '';
  return valor % 1 === 0 ? String(valor) : valor.toFixed(1);
};

const formatearNombre = (texto: string): string => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const calcularSuma = (n1: number | null, n2: number | null): string => {
  if (n1 === null || n2 === null) return '';
  const suma = (n1 + n2) / 2;
  return fmt(suma);
};

const calcularPfNum = (n1: number | null, n2: number | null, sup: number | null): number | null => {
  if (n1 === null || n2 === null) return null;
  const suma = (n1 + n2) / 2;
  if (sup !== null) return (suma + sup) / 2;
  return suma;
};

const calcularPf = (n1: number | null, n2: number | null, sup: number | null): string => {
  return fmt(calcularPfNum(n1, n2, sup));
};

export const guardarSupletorio = async (req: Request, res: Response) => {
  const { matriculaId, materiaId, valor } = req.body;
  try {
    const supletorio = await prisma.supletorio.upsert({
      where: {
        materiaId_matriculaId: {
          materiaId: Number(materiaId),
          matriculaId: Number(matriculaId)
        }
      },
      update: { valor: valor !== null ? Number(valor) : null },
      create: {
        materiaId: Number(materiaId),
        matriculaId: Number(matriculaId),
        valor: valor !== null ? Number(valor) : null
      }
    });
    res.json({ message: 'Supletorio guardado', supletorio });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar supletorio' });
  }
};

export const guardarSupletoriosMasivo = async (req: Request, res: Response) => {
  const { supletorios } = req.body;
  try {
    const resultados = await Promise.all(
      supletorios.map((s: any) =>
        prisma.supletorio.upsert({
          where: {
            materiaId_matriculaId: {
              materiaId: Number(s.materiaId),
              matriculaId: Number(s.matriculaId)
            }
          },
          update: { valor: s.valor !== null ? Number(s.valor) : null },
          create: {
            materiaId: Number(s.materiaId),
            matriculaId: Number(s.matriculaId),
            valor: s.valor !== null ? Number(s.valor) : null
          }
        })
      )
    );
    res.json({ message: 'Supletorios guardados', total: resultados.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar supletorios' });
  }
};

export const generarAL15 = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { lugarFecha, jornada } = req.query;

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: Number(cursoId) },
      include: {
        materias: {
          include: {
            profesor: { select: { cedula: true, nombre: true, apellido: true } },
            profesorPrincipal: { select: { cedula: true, nombre: true, apellido: true } }
          },
          orderBy: { id: 'asc' }
        },
        matriculas: {
          include: {
            notasTarea: {
              include: { tarea: { include: { materia: true } } }
            },
            supletorios: { include: { materia: true } },
            notasDisciplina: true
          },
          orderBy: { apellidos: 'asc' }
        }
      }
    });

    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const getN = (matricula: any, nombreMateria: string, semestre: number): number | null => {
      const notas = matricula.notasTarea.filter((n: any) =>
        n.tarea.materia.nombre.toLowerCase().includes(nombreMateria.toLowerCase()) &&
        n.tarea.semestre === semestre && n.valor !== null
      );
      if (notas.length === 0) return null;
      return notas.reduce((a: number, b: any) => a + b.valor, 0) / notas.length;
    };

    const getN1 = (m: any, nombre: string) => getN(m, nombre, 1);
    const getN2 = (m: any, nombre: string) => getN(m, nombre, 2);

    const getSup = (matricula: any, nombreMateria: string): number | null => {
      const sup = matricula.supletorios.find((s: any) =>
        s.materia.nombre.toLowerCase().includes(nombreMateria.toLowerCase())
      );
      return sup?.valor ?? null;
    };

    const getCedula = (nombreMateria: string): string => {
      const materia = curso.materias.find(m =>
        m.nombre.toLowerCase().includes(nombreMateria.toLowerCase()) && !m.esSubmateria
      );
      return materia?.profesor?.cedula || '';
    };

    const materiaPrincipal = curso.materias.find(
      m => (m.nombre === 'Práctica' || m.nombre === 'Teoría') && !m.esSubmateria
    );
    const cc_tp = materiaPrincipal?.profesorPrincipal?.cedula || '';

    const meses = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                   'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const anio1 = `${meses[curso.fechaInicio.getMonth()]} ${curso.fechaInicio.getFullYear()}`;
    const anio2 = `${meses[curso.fechaFin.getMonth()]} ${curso.fechaFin.getFullYear()}`;

    const estudiantes = curso.matriculas.map((m, index) => {
      const teoria_n1 = getN1(m, 'Teoría');
      const teoria_n2 = getN2(m, 'Teoría');
      const teoria_sup = getSup(m, 'Teoría');

      const practica_n1 = getN1(m, 'Práctica');
      const practica_n2 = getN2(m, 'Práctica');
      const practica_sup = getSup(m, 'Práctica');

      const adm_n1 = getN1(m, 'Administración');
      const adm_n2 = getN2(m, 'Administración');
      const adm_sup = getSup(m, 'Administración');

      const cont_n1 = getN1(m, 'Contabilidad');
      const cont_n2 = getN2(m, 'Contabilidad');
      const cont_sup = getSup(m, 'Contabilidad');

      const tics_n1 = getN1(m, 'TICs');
      const tics_n2 = getN2(m, 'TICs');
      const tics_sup = getSup(m, 'TICs');

      const ingles_n1 = getN1(m, 'Inglés');
      const ingles_n2 = getN2(m, 'Inglés');
      const ingles_sup = getSup(m, 'Inglés');

      const desarrollo_n1 = getN1(m, 'Desarrollo');
      const desarrollo_n2 = getN2(m, 'Desarrollo');
      const desarrollo_sup = getSup(m, 'Desarrollo');

      const legislacion_n1 = getN1(m, 'Legislación');
      const legislacion_n2 = getN2(m, 'Legislación');
      const legislacion_sup = getSup(m, 'Legislación');

      const proy_n1 = getN1(m, 'Elaboración');
      const proy_n2 = getN2(m, 'Elaboración');
      const proy_sup = getSup(m, 'Elaboración');

      const notasDisc = m.notasDisciplina || [];
      const disciplinaVal = notasDisc.length > 0
        ? notasDisc.reduce((a: number, b: any) => a + b.valor, 0) / notasDisc.length
        : null;

      const promediosPf = [
        calcularPfNum(teoria_n1, teoria_n2, teoria_sup),
        calcularPfNum(practica_n1, practica_n2, practica_sup),
        calcularPfNum(adm_n1, adm_n2, adm_sup),
        calcularPfNum(cont_n1, cont_n2, cont_sup),
        calcularPfNum(tics_n1, tics_n2, tics_sup),
        calcularPfNum(ingles_n1, ingles_n2, ingles_sup),
        calcularPfNum(desarrollo_n1, desarrollo_n2, desarrollo_sup),
        calcularPfNum(legislacion_n1, legislacion_n2, legislacion_sup),
        calcularPfNum(proy_n1, proy_n2, proy_sup),
        disciplinaVal
      ].filter(n => n !== null) as number[];

      const promedioNum = promediosPf.length > 0
        ? promediosPf.reduce((a, b) => a + b, 0) / promediosPf.length
        : null;

      const promedio = fmt(promedioNum);
      const nomenclatura = promedioNum !== null && promedioNum > 9
        ? 'Supera el Aprendizaje'
        : '';

      return {
        num: String(index + 1),
        nombres: `${formatearNombre(m.apellidos)} ${formatearNombre(m.nombres)}`,

        teoria_n1: fmt(teoria_n1), teoria_n2: fmt(teoria_n2),
        teoria_suma: calcularSuma(teoria_n1, teoria_n2),
        teoria_sup: fmt(teoria_sup),
        teoria_pf: calcularPf(teoria_n1, teoria_n2, teoria_sup),

        practica_n1: fmt(practica_n1), practica_n2: fmt(practica_n2),
        practica_suma: calcularSuma(practica_n1, practica_n2),
        practica_sup: fmt(practica_sup),
        practica_pf: calcularPf(practica_n1, practica_n2, practica_sup),

        adm_n1: fmt(adm_n1), adm_n2: fmt(adm_n2),
        adm_suma: calcularSuma(adm_n1, adm_n2),
        adm_sup: fmt(adm_sup),
        adm_pf: calcularPf(adm_n1, adm_n2, adm_sup),

        cont_n1: fmt(cont_n1), cont_n2: fmt(cont_n2),
        cont_suma: calcularSuma(cont_n1, cont_n2),
        cont_sup: fmt(cont_sup),
        cont_pf: calcularPf(cont_n1, cont_n2, cont_sup),

        tics_n1: fmt(tics_n1), tics_n2: fmt(tics_n2),
        tics_suma: calcularSuma(tics_n1, tics_n2),
        tics_sup: fmt(tics_sup),
        tics_pf: calcularPf(tics_n1, tics_n2, tics_sup),

        ingles_n1: fmt(ingles_n1), ingles_n2: fmt(ingles_n2),
        ingles_suma: calcularSuma(ingles_n1, ingles_n2),
        ingles_sup: fmt(ingles_sup),
        ingles_pf: calcularPf(ingles_n1, ingles_n2, ingles_sup),

        desarrollo_n1: fmt(desarrollo_n1), desarrollo_n2: fmt(desarrollo_n2),
        desarrollo_suma: calcularSuma(desarrollo_n1, desarrollo_n2),
        desarrollo_sup: fmt(desarrollo_sup),
        desarrollo_pf: calcularPf(desarrollo_n1, desarrollo_n2, desarrollo_sup),

        legislacion_n1: fmt(legislacion_n1), legislacion_n2: fmt(legislacion_n2),
        legislacion_suma: calcularSuma(legislacion_n1, legislacion_n2),
        legislacion_sup: fmt(legislacion_sup),
        legislacion_pf: calcularPf(legislacion_n1, legislacion_n2, legislacion_sup),

        proy_n1: fmt(proy_n1), proy_n2: fmt(proy_n2),
        proy_suma: calcularSuma(proy_n1, proy_n2),
        proy_sup: fmt(proy_sup),
        proy_pf: calcularPf(proy_n1, proy_n2, proy_sup),

        disciplina: fmt(disciplinaVal),
        promedio,
        nomenclatura
      };
    });

    const templatePath = path.join(process.cwd(), 'templates', 'AL15CUADROFINALNOTAS.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    doc.render({
      ramaArtesanal: curso.ramaArtesanal.toUpperCase(),
      anio1,
      anio2,
      jornada: (String(jornada || 'MATUTINA')).toUpperCase(),
      lugarFecha: lugarFecha || '',
      cc_tp,
      cc_adm: getCedula('Administración'),
      cc_cont: getCedula('Contabilidad'),
      cc_tics: getCedula('TICs'),
      cc_ingles: getCedula('Inglés'),
      cc_desarollo: getCedula('Desarrollo'),
      cc_legislacion: getCedula('Legislación'),
      estudiantes,
      estudiantes2: estudiantes
    });

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', `attachment; filename=AL15_${curso.ramaArtesanal}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar AL15' });
  }
};

export const generarAL19 = async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { lugarFecha, jornada } = req.query;

  try {
    const curso = await prisma.curso.findUnique({
      where: { id: Number(cursoId) },
      include: {
        matriculas: {
          include: {
            notasTarea: {
              include: { tarea: { include: { materia: true } } }
            },
            supletorios: { include: { materia: true } }
          },
          orderBy: { apellidos: 'asc' }
        }
      }
    });

    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const getN = (matricula: any, semestre: number): number | null => {
      const notas = matricula.notasTarea.filter((n: any) =>
        n.tarea.materia.nombre.toLowerCase().includes('elaboración') &&
        n.tarea.semestre === semestre && n.valor !== null
      );
      if (notas.length === 0) return null;
      return notas.reduce((a: number, b: any) => a + b.valor, 0) / notas.length;
    };

    const getSup = (matricula: any): number | null => {
      const sup = matricula.supletorios.find((s: any) =>
        s.materia.nombre.toLowerCase().includes('elaboración')
      );
      return sup?.valor ?? null;
    };

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const anio1 = `${meses[curso.fechaInicio.getMonth()]} ${curso.fechaInicio.getFullYear()}`;
    const anio2 = `${meses[curso.fechaFin.getMonth()]} ${curso.fechaFin.getFullYear()}`;

    const estudiantes = curso.matriculas.map((m, index) => {
      const n1 = getN(m, 1);
      const n2 = getN(m, 2);
      const sup = getSup(m);
      const notaNum = calcularPfNum(n1, n2, sup);
      const nota = fmt(notaNum);
      const observacion = notaNum === null ? '' : notaNum >= 7 ? 'Aprobado' : 'Desaprobado';

      return {
        num: String(index + 1),
        nombres: `${formatearNombre(m.apellidos)} ${formatearNombre(m.nombres)}`,
        cedula: m.cedula || '',
        nota,
        observacion
      };
    });

    const templatePath = path.join(process.cwd(), 'templates', 'AL19NOTASPROYECTOS.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    doc.render({
      ramaArtesanal: curso.ramaArtesanal.toUpperCase(),
      jornada: (String(jornada || 'MATUTINA')).toUpperCase(),
      anio1,
      anio2,
      lugarFecha: lugarFecha || '',
      estudiantes
    });

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', `attachment; filename=AL19_${curso.ramaArtesanal}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar AL19' });
  }
};