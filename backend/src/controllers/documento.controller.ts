import { Request, Response } from 'express';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

const generarWord = (templateName: string, datos: any): Buffer => {
  const templatePath = path.join(process.cwd(), 'templates', templateName);
  console.log('>>> Leyendo:', templatePath);
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

  const datos = {
    matriculaNo: (matricula.matriculaNo || '').toUpperCase(),
    anio1: matricula.curso.anioFormativo.split('-')[0]?.trim() || '',
    anio2: matricula.curso.anioFormativo.split('-')[1]?.trim() || '',
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

    const datos = {
      AF1: matricula.curso.anioFormativo.split('-')[0]?.trim() || '',
      AF2: matricula.curso.anioFormativo.split('-')[1]?.trim() || '',
      nombres: matricula.nombres || '',
      apellidos: matricula.apellidos || '',
      raArt: matricula.curso.ramaArtesanal || '',
      matriculaNo: matricula.matriculaNo || '',
      tomo: matricula.tomo || '',
      pagina: matricula.pagina || '',
      Especialidad: matricula.especialidad || '',
      unidadeducativa: matricula.unidadeducativa || '',
      lugarfechacertificado: matricula.lugarfechacertificado || ''
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