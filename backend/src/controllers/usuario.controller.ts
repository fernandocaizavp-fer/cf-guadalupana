import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export const crearDocente = async (req: Request, res: Response) => {
  const { nombre, apellido, correo, cedula } = req.body;
  try {
    const hash = await bcrypt.hash(cedula, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.toUpperCase(),
        apellido: apellido.toUpperCase(),
        correo: correo.toLowerCase(),
        cedula,
        password: hash,
        rol: 'PROFESOR'
      }
    });
    res.json({ message: 'Docente creado', usuario });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo o cédula ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear docente' });
  }
};

export const listarDocentes = async (req: Request, res: Response) => {
  try {
    const docentes = await prisma.usuario.findMany({
      where: { rol: 'PROFESOR' },
      select: { id: true, nombre: true, apellido: true, correo: true, cedula: true, rol: true, createdAt: true }
    });
    res.json(docentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar docentes' });
  }
};

export const actualizarDocente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, correo, cedula } = req.body;
  try {
    const data: any = {
      nombre: nombre?.toUpperCase(),
      apellido: apellido?.toUpperCase(),
      correo: correo?.toLowerCase(),
      cedula
    };
    if (cedula) data.password = await bcrypt.hash(cedula, 10);
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });
    res.json({ message: 'Docente actualizado', usuario });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo o cédula ya está registrado' });
    }
    res.status(500).json({ error: 'Error al actualizar docente' });
  }
};

export const eliminarDocente = async (req: Request, res: Response) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Docente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar docente' });
  }
};

export const asignarProfesor = async (req: Request, res: Response) => {
  const { materiaId, profesorId } = req.body;
  try {
    const materia = await prisma.materia.update({
      where: { id: Number(materiaId) },
      data: { profesorId: Number(profesorId) }
    });
    res.json({ message: 'Profesor asignado', materia });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar profesor' });
  }
};

export const asignarProfesorPrincipalMateria = async (req: Request, res: Response) => {
  const { materiaId, profesorId } = req.body;
  try {
    const materia = await prisma.materia.update({
      where: { id: Number(materiaId) },
      data: { profesorPrincipalId: Number(profesorId) }
    });
    res.json({ message: 'Profesor principal asignado', materia });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar profesor principal' });
  }
};

export const getMisMateria = async (req: Request, res: Response) => {
  const { profesorId } = req.params;
  try {
    const materias = await prisma.materia.findMany({
      where: { profesorId: Number(profesorId) },
      include: { curso: true }
    });
    res.json(materias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener materias' });
  }
};

export const getPerfilEstudiante = async (req: Request, res: Response) => {
  const { usuarioId } = req.params;
  try {
    const matricula = await prisma.matricula.findFirst({
      where: { usuarioId: Number(usuarioId) },
      include: {
        curso: { include: { materias: true } },
        notasTarea: {
          include: {
            tarea: { include: { materia: true } }
          }
        },
        notasDisciplina: true
      }
    });
    if (!matricula) return res.status(404).json({ error: 'Matrícula no encontrada' });
    res.json(matricula);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};