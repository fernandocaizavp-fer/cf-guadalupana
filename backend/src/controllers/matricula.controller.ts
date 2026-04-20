import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export const crearMatricula = async (req: Request, res: Response) => {
  const {
    matriculaNo, tomo, pagina, apellidos, nombres, cedula,
    fechaNacimiento, pais, provincia, canton, parroquia, ciudad,
    nacionalidad, calle, num, transversal, telefono, correo,
    cursoanterior, unidadeducativa, centroformacionanterior,
    nombrepapa, profesionpapa, ocupacionpapa,
    nombremama, profesionmama, ocupacionmama,
    nombrerepresentante, ocupacionrepresentante,
    domiciliorepresentante, telefonorepresentante,
    correoestudiante, lugarfechamatricula,
    especialidad, lugarfechacertificado, cursoId
  } = req.body;

  try {
    const hash = await bcrypt.hash(cedula, 10);

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre: nombres.toUpperCase(),
          apellido: apellidos.toUpperCase(),
          correo: (correoestudiante || correo).toLowerCase(),
          password: hash,
          rol: 'ESTUDIANTE'
        }
      });

      const matricula = await tx.matricula.create({
        data: {
          matriculaNo, tomo, pagina,
          apellidos: apellidos.toUpperCase(),
          nombres: nombres.toUpperCase(),
          cedula,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          pais: pais?.toUpperCase(),
          provincia: provincia?.toUpperCase(),
          canton: canton?.toUpperCase(),
          parroquia: parroquia?.toUpperCase(),
          ciudad: ciudad?.toUpperCase(),
          nacionalidad: nacionalidad?.toUpperCase(),
          calle: calle?.toUpperCase(),
          num, transversal, telefono,
          correo: (correoestudiante || correo)?.toLowerCase(),
          cursoanterior: cursoanterior?.toUpperCase(),
          unidadeducativa: unidadeducativa?.toUpperCase(),
          centroformacionanterior: centroformacionanterior?.toUpperCase(),
          nombrepapa: nombrepapa?.toUpperCase(),
          profesionpapa: profesionpapa?.toUpperCase(),
          ocupacionpapa: ocupacionpapa?.toUpperCase(),
          nombremama: nombremama?.toUpperCase(),
          profesionmama: profesionmama?.toUpperCase(),
          ocupacionmama: ocupacionmama?.toUpperCase(),
          nombrerepresentante: nombrerepresentante?.toUpperCase(),
          ocupacionrepresentante: ocupacionrepresentante?.toUpperCase(),
          domiciliorepresentante: domiciliorepresentante?.toUpperCase(),
          telefonorepresentante,
          correoestudiante: (correoestudiante || correo)?.toLowerCase(),
          lugarfechamatricula: lugarfechamatricula?.toUpperCase(),
          especialidad: especialidad?.toUpperCase(),
          lugarfechacertificado: lugarfechacertificado?.toUpperCase(),
          cursoId: Number(cursoId),
          usuarioId: usuario.id
        },
        include: { curso: true }
      });

      return { usuario, matricula };
    });

    res.json({
      message: 'Matrícula creada exitosamente',
      matricula: resultado.matricula,
      credenciales: {
        correo: resultado.usuario.correo,
        passwordDefault: `Su cédula: ${cedula}`
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El estudiante ya está matriculado (cédula o correo duplicado)' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear matrícula' });
  }
};

export const actualizarMatricula = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const matricula = await prisma.matricula.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json({ message: 'Matrícula actualizada', matricula });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar matrícula' });
  }
};

export const eliminarMatricula = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.matricula.delete({ where: { id: Number(id) } });
    res.json({ message: 'Matrícula eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar matrícula' });
  }
};

export const buscarEstudiante = async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const matriculas = await prisma.matricula.findMany({
      where: {
        OR: [
          { nombres: { contains: String(q), mode: 'insensitive' } },
          { apellidos: { contains: String(q), mode: 'insensitive' } },
          { cedula: { contains: String(q) } }
        ]
      },
      include: { curso: true }
    });
    res.json(matriculas);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar' });
  }
};

export const obtenerMatricula = async (req: Request, res: Response) => {
  try {
    const matricula = await prisma.matricula.findUnique({
      where: { id: Number(req.params.id) },
      include: { curso: { include: { materias: true } } }
    });
    if (!matricula) return res.status(404).json({ error: 'Matrícula no encontrada' });
    res.json(matricula);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener matrícula' });
  }
};