import { Request, Response } from 'express';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { enviarCodigoRecuperacion } from '../lib/correo';

export const login = async (req: Request, res: Response) => {
  const { correo, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: { matricula: { select: { activo: true } } }
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Cuenta desactivada, o estudiante cuya matrícula fue eliminada (incluye a
    // los eliminados antes de que eliminarMatricula también desactivara la cuenta).
    if (!usuario.activo || usuario.matricula?.activo === false) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada. Comunícate con la administración del centro.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, debeCambiarPassword: usuario.debeCambiarPassword } });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const crearAdmin = async (req: Request, res: Response) => {
  const { nombre, apellido, correo, password } = req.body;

  if (!nombre || !apellido || !correo) {
    return res.status(400).json({ error: 'Nombre, apellido y correo son obligatorios' });
  }
  // Mismas reglas que cambiarPassword: un admin tiene control total del sistema.
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos una mayúscula' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos un número' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre, apellido,
        correo: String(correo).trim(),
        password: hash, rol: 'ADMIN', debeCambiarPassword: false
      }
    });
    res.json({ message: 'Admin creado', usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo } });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    res.status(500).json({ error: 'Error al crear admin' });
  }
};

export const cambiarPassword = async (req: Request, res: Response) => {
  const { usuarioId, passwordActual, passwordNueva } = req.body;

  // Validaciones de seguridad de la nueva contraseña
  if (!passwordNueva || passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (!/[A-Z]/.test(passwordNueva)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos una mayúscula' });
  }
  if (!/[0-9]/.test(passwordNueva)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos un número' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({
      where: { id: Number(usuarioId) },
      data: { password: hash, debeCambiarPassword: false }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};

// Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
const MENSAJE_RECUPERACION = 'Si el correo está registrado, recibirá un código de recuperación';

export const solicitarRecuperacion = async (req: Request, res: Response) => {
  const correo = typeof req.body?.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  if (!correo) return res.status(400).json({ error: 'Ingrese su correo electrónico' });

  try {
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) return res.json({ message: MENSAJE_RECUPERACION });

    // Código de 6 dígitos con un generador criptográficamente seguro
    const codigo = String(randomInt(100000, 1000000));
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Un código nuevo deja sin efecto a los anteriores que no se usaron
    await prisma.recuperacionPassword.updateMany({ where: { correo, usado: false }, data: { usado: true } });
    const registro = await prisma.recuperacionPassword.create({ data: { correo, codigo, expira } });

    // El correo se envía desde el servidor: el código nunca llega al navegador
    try {
      await enviarCodigoRecuperacion({ correo, nombre: usuario.nombre, codigo });
    } catch (errorEnvio) {
      console.error('No se pudo enviar el código de recuperación:', errorEnvio);
      await prisma.recuperacionPassword.delete({ where: { id: registro.id } });
      return res.status(502).json({ error: 'No se pudo enviar el correo. Intente de nuevo más tarde' });
    }

    res.json({ message: MENSAJE_RECUPERACION });
  } catch (error) {
    res.status(500).json({ error: 'Error al solicitar recuperación' });
  }
};

export const restablecerPassword = async (req: Request, res: Response) => {
  const { correo, codigo, passwordNueva } = req.body;

  // Validaciones de la nueva contraseña
  if (!passwordNueva || passwordNueva.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (!/[A-Z]/.test(passwordNueva)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos una mayúscula' });
  }
  if (!/[0-9]/.test(passwordNueva)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos un número' });
  }

  try {
    const registro = await prisma.recuperacionPassword.findFirst({
      where: {
        correo: correo.toLowerCase(),
        codigo,
        usado: false,
        expira: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!registro) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({
      where: { correo: correo.toLowerCase() },
      data: { password: hash, debeCambiarPassword: false }
    });

    await prisma.recuperacionPassword.update({
      where: { id: registro.id },
      data: { usado: true }
    });

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};