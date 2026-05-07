import { Request, Response } from 'express';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const mesesMayusculas = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const formatearNombre = (texto: string): string => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const generarWord = (templateName: string, datos: any): Buffer => {
  const templatePath = path.join(process.cwd(), 'templates', templateName);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' }
  });
  doc.render(datos);
  return doc.getZip().generate({ type: 'nodebuffer' });
};

export const descargarMatricula = async (req: Request, res: Response) => {
  try {
    const matricula = await prisma.matricula.findUnique({
      where: { id: Number(req.params.id) },
      include: { curso: true }
    });
    if (!matricula) return res.status(404).json({ error: 'Matrícula no encontrada' });

    const fecha = matricula.fechaNacimiento ? new Date(matricula.fechaNacimiento) : null;

    // AL12 — TODO EN MAYÚSCULAS excepto correo
    const anio1 = `${mesesMayusculas[matricula.curso.fechaInicio.getMonth()]} ${matricula.curso.fechaInicio.getFullYear()}`;
    const anio2 = `${mesesMayusculas[matricula.curso.fechaFin.getMonth()]} ${matricula.curso.fechaFin.getFullYear()}`;

    const datos = {
      matriculaNo: matricula.matriculaNo || '',
      anio1,
      anio2,
      tomo: (matricula.tomo || '').toUpperCase(),
      pagina: (matricula.pagina || '').toUpperCase(),
      raArt: (matricula.curso.ramaArtesanal || '').toUpperCase(),
      apellidos: (matricula.apellidos || '').toUpperCase(),
      nombres: (matricula.nombres || '').toUpperCase(),
      pais: (matricula.pais || '').toUpperCase(),
      provincia: (matricula.provincia || '').toUpperCase(),
      canton: (matricula.canton || '').toUpperCase(),
      parroquia: (matricula.parroquia || '').toUpperCase(),
      PARROQUIA: (matricula.parroquia || '').toUpperCase(),
      ciudad: (matricula.ciudad || '').toUpperCase(),
      anio: fecha ? String(fecha.getFullYear()) : '',
      mes: fecha ? String(fecha.getMonth() + 1).padStart(2, '0') : '',
      dia: fecha ? String(fecha.getDate()).padStart(2, '0') : '',
      nacionalidad: (matricula.nacionalidad || '').toUpperCase(),
      cedula: matricula.cedula || '',
      calle: (matricula.calle || '').toUpperCase(),
      num: (matricula.num || '').toUpperCase(),
      transversal: (matricula.transversal || '').toUpperCase(),
      telefono: matricula.telefono || '',
      cursoanterior: (matricula.cursoanterior || '').toUpperCase(),
      unidadeducativa: (matricula.unidadeducativa || '').toUpperCase(),
      centroformacionanterior: (matricula.centroformacionanterior || '').toUpperCase(),
      nombrepapa: (matricula.nombrepapa || '').toUpperCase(),
      profesionpapa: (matricula.profesionpapa || '').toUpperCase(),
      ocupacionpapa: (matricula.ocupacionpapa || '').toUpperCase(),
      nombremama: (matricula.nombremama || '').toUpperCase(),
      profesionmama: (matricula.profesionmama || '').toUpperCase(),
      ocupacionmama: (matricula.ocupacionmama || '').toUpperCase(),
      nombrerepresentante: (matricula.nombrerepresentante || '').toUpperCase(),
      ocupacionrepresentante: (matricula.ocupacionrepresentante || '').toUpperCase(),
      domiciliorepresentante: (matricula.domiciliorepresentante || '').toUpperCase(),
      telefonorepresentante: matricula.telefonorepresentante || '',
      correoestudiante: (matricula.correoestudiante || '').toLowerCase(),
      lugarfechamatricula: (matricula.lugarfechamatricula || '').toUpperCase()
    };

    const buffer = generarWord('MATRICULAL12.docx', datos);
    res.setHeader('Content-Disposition', `attachment; filename=matricula_${matricula.cedula}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar documento' });
  }
};

export const descargarCertificado = async (req: Request, res: Response) => {
  try {
    const matricula = await prisma.matricula.findUnique({
      where: { id: Number(req.params.id) },
      include: { curso: true }
    });
    if (!matricula) return res.status(404).json({ error: 'Matrícula no encontrada' });

    // AL13 — Solo primera letra mayúscula excepto nombres que van en mayúsculas
    const anio1 = `${meses[matricula.curso.fechaInicio.getMonth()]} ${matricula.curso.fechaInicio.getFullYear()}`;
    const anio2 = `${meses[matricula.curso.fechaFin.getMonth()]} ${matricula.curso.fechaFin.getFullYear()}`;

    const esMasculino = (matricula as any).sexo === 'Masculino';
    const prefijo = esMasculino ? 'El' : 'La';
    const tratamiento = esMasculino ? 'Sr.' : 'Srta.';
    const elLa = esMasculino ? 'el' : 'la';
    const matriculado = esMasculino ? 'matriculado' : 'matriculada';

    const nivelEstudio = (matricula as any).nivelEstudio || '';
    const tipoBachiller = (matricula as any).tipoBachiller || '';

    const xA1 = nivelEstudio === 'a1' ? 'X' : '';
    const xA2 = nivelEstudio === 'a2' ? 'X' : '';
    const xBachiller = nivelEstudio === 'a4' && tipoBachiller === 'Bachiller' ? 'X' : '';
    const xSuperior = nivelEstudio === 'a4' && tipoBachiller === 'Superior' ? 'X' : '';
    const xOtro = nivelEstudio === 'a4' && tipoBachiller === 'Otro' ? 'X' : '';

    const datos = {
      AF1: anio1,
      AF2: anio2,
      prefijo,
      tratamiento,
      elLa,
      matriculado,
      nombres: (matricula.nombres || '').toUpperCase(),
      apellidos: (matricula.apellidos || '').toUpperCase(),
      raArt: formatearNombre(matricula.curso.ramaArtesanal || ''),
      matriculaNo: matricula.matriculaNo || '',
      tomo: matricula.tomo || '',
      pagina: matricula.pagina || '',
      Especialidad: formatearNombre(matricula.especialidad || ''),
      unidadeducativa: formatearNombre(matricula.unidadeducativa || ''),
      PARROQUIA: formatearNombre(matricula.parroquia || ''),
      lugarfechacertificado: formatearNombre(matricula.lugarfechacertificado || ''),
      xA1, xA2, xBachiller, xSuperior, xOtro,
      conferidoPorA1: formatearNombre((matricula as any).conferidoPorA1 || ''),
      conferidoPorA2: formatearNombre((matricula as any).conferidoPorA2 || ''),
      conferidoPorA4: formatearNombre(matricula.unidadeducativa || '')
    };

    const buffer = generarWord('CERTIFICADOMATRICULAL13.docx', datos);
    res.setHeader('Content-Disposition', `attachment; filename=certificado_${matricula.cedula}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar certificado' });
  }
};