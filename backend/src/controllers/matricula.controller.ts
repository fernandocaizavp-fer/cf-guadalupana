import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { validarIdentificacion } from '../lib/cedula';

// Nombre legible de cada columna, para explicar el error P2000 de Prisma
// ("valor demasiado largo para la columna") en vez de un 500 genérico.
// El frontend valida lo mismo antes de enviar (services/matricula-limites.ts);
// esto es el respaldo si algo llega igual (p. ej. un cliente desactualizado).
const ETIQUETAS_CAMPOS: Record<string, string> = {
  tomo: 'Tomo', apellidos: 'Apellidos', nombres: 'Nombres', apellido: 'Apellidos',
  nombre: 'Nombres', cedula: 'Cédula', sexo: 'Sexo', nivelEstudio: 'Nivel de estudio',
  pais: 'País', provincia: 'Provincia', canton: 'Cantón', parroquia: 'Parroquia',
  ciudad: 'Ciudad', nacionalidad: 'Nacionalidad', telefono: 'Teléfono',
  correo: 'Correo', correoestudiante: 'Correo del estudiante', calle: 'Calle',
  num: 'Número de casa', transversal: 'Transversal', cursoanterior: 'Curso anterior',
  centroformacionanterior: 'Centro de formación anterior', tipoBachiller: 'Tipo de título',
  conferidoPorA1: 'Conferido por (A.1)', conferidoPorA2: 'Conferido por (A.2)',
  especialidad: 'Especialidad', unidadeducativa: 'Unidad educativa',
  nombrepapa: 'Nombre del padre', profesionpapa: 'Profesión del padre',
  ocupacionpapa: 'Ocupación del padre', nombremama: 'Nombre de la madre',
  profesionmama: 'Profesión de la madre', ocupacionmama: 'Ocupación de la madre',
  nombrerepresentante: 'Nombre del representante',
  ocupacionrepresentante: 'Ocupación del representante',
  domiciliorepresentante: 'Domicilio del representante',
  telefonorepresentante: 'Teléfono del representante',
  lugarfechamatricula: 'Lugar y fecha de matrícula',
  lugarfechacertificado: 'Lugar y fecha del certificado'
};

// Devuelve el mensaje para un P2000, o null si el error es de otro tipo.
const mensajeCampoLargo = (error: any): string | null => {
  if (error?.code !== 'P2000') return null;
  const columna = String(error.meta?.column_name ?? error.meta?.target ?? '');
  const etiqueta = ETIQUETAS_CAMPOS[columna];
  return etiqueta
    ? `El campo "${etiqueta}" es demasiado largo. Acórtalo e inténtalo de nuevo.`
    : 'Uno de los campos es demasiado largo. Revisa los datos e inténtalo de nuevo.';
};

// Fuente única de verdad para la numeración de una matrícula dentro de un curso:
// el correlativo es max(matriculaNo)+1 (no un count, para no reutilizar números
// si una matrícula fue borrada físicamente), el tomo por defecto es '1' y la
// página se calcula como (correlativo * 2) - 1 (1, 3, 5, ... impares).
const calcularSiguienteMatricula = async (cursoId: number, tomoActual?: string) => {
  // Solo matrículas activas: al archivar un estudiante (activo=false) su número
  // se libera y vuelve a estar disponible (si no queda ninguno, el próximo es 001).
  const existentes = await prisma.matricula.findMany({
    where: { cursoId, activo: true },
    select: { matriculaNo: true }
  });
  const maxNo = existentes.reduce(
    (max, e) => Math.max(max, parseInt(e.matriculaNo, 10) || 0),
    0
  );
  const numericMatriculaNo = maxNo + 1;
  return {
    matriculaNo: String(numericMatriculaNo).padStart(3, '0'),
    tomo: tomoActual || '1',
    pagina: String((numericMatriculaNo * 2) - 1)
  };
};

// Vista previa del próximo número de matrícula/tomo/página para un curso,
// para que el formulario los muestre autollenados antes de guardar.
export const siguienteMatricula = async (req: Request, res: Response) => {
  try {
    const cursoId = Number(req.params.cursoId);
    if (!cursoId) return res.status(400).json({ error: 'Curso inválido' });
    const preview = await calcularSiguienteMatricula(cursoId);
    res.json(preview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular el número de matrícula' });
  }
};

export const crearMatricula = async (req: Request, res: Response) => {
  const {
    tomo, pagina, apellidos, nombres, cedula, sexo,
    fechaNacimiento, anioNacimiento, mesNacimiento, diaNacimiento,
    pais, provincia, canton, parroquia, ciudad,
    nacionalidad, calle, num, transversal, telefono, correo,
    nivelEstudio, tipoBachiller, conferidoPorA1, conferidoPorA2,
    cursoanterior, unidadeducativa, centroformacionanterior,
    nombrepapa, profesionpapa, ocupacionpapa,
    nombremama, profesionmama, ocupacionmama,
    nombrerepresentante, ocupacionrepresentante,
    domiciliorepresentante, telefonorepresentante,
    correoestudiante, lugarfechamatricula,
    especialidad, lugarfechacertificado, cursoId
  } = req.body;

  const errorCedula = validarIdentificacion(cedula);
  if (errorCedula) return res.status(400).json({ error: errorCedula });

  try {
    const hash = await bcrypt.hash(cedula, 10);

    // Numeración (correlativo, tomo, página) desde la fuente única de verdad.
    const { matriculaNo, tomo: tomoFinal, pagina: paginaCalculada } =
      await calcularSiguienteMatricula(Number(cursoId), tomo);

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
          matriculaNo,
          tomo: tomoFinal,
          pagina: paginaCalculada,
          apellidos: apellidos.toUpperCase(),
          nombres: nombres.toUpperCase(),
          cedula,
          sexo,
          nivelEstudio,
          lugarfechamatricula: lugarfechamatricula?.toUpperCase(),
          cursoId: Number(cursoId),
          usuarioId: usuario.id,

          // Datos personales en tabla separada
          datosPersonales: {
            create: {
              fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
              anioNacimiento,
              mesNacimiento,
              diaNacimiento,
              pais: pais?.toUpperCase(),
              provincia: provincia?.toUpperCase(),
              canton: canton?.toUpperCase(),
              parroquia: parroquia?.toUpperCase(),
              ciudad: ciudad?.toUpperCase(),
              nacionalidad: nacionalidad?.toUpperCase(),
              calle: calle?.toUpperCase(),
              num,
              transversal,
              telefono,
              correo: (correoestudiante || correo)?.toLowerCase()
            }
          },

          // Datos familiares en tabla separada
          datosFamiliares: {
            create: {
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
              correoestudiante: (correoestudiante || correo)?.toLowerCase()
            }
          },

          // Datos académicos en tabla separada
          datosAcademicos: {
            create: {
              cursoanterior: cursoanterior?.toUpperCase(),
              unidadeducativa: unidadeducativa?.toUpperCase(),
              centroformacionanterior: centroformacionanterior?.toUpperCase(),
              tipoBachiller,
              conferidoPorA1: conferidoPorA1?.toUpperCase(),
              conferidoPorA2: conferidoPorA2?.toUpperCase(),
              especialidad: especialidad?.toUpperCase(),
              lugarfechacertificado: lugarfechacertificado?.toUpperCase()
            }
          }
        },
        include: {
          curso: true,
          datosPersonales: true,
          datosFamiliares: true,
          datosAcademicos: true
        }
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
      const target = error.meta?.target;
      const campos = Array.isArray(target) ? target.join(',') : String(target ?? '');
      if (campos.includes('cedula')) {
        return res.status(400).json({ error: 'Ya existe un estudiante matriculado con esa cédula' });
      }
      if (campos.includes('correo')) {
        return res.status(400).json({ error: 'Ya existe una cuenta con ese correo' });
      }
      if (campos.includes('matriculaNo')) {
        return res.status(400).json({ error: 'El número de matrícula ya existe en este curso' });
      }
      return res.status(400).json({ error: 'Registro duplicado' });
    }
    const campoLargo = mensajeCampoLargo(error);
    if (campoLargo) return res.status(400).json({ error: campoLargo });
    console.error(error);
    res.status(500).json({ error: 'Error al crear matrícula' });
  }
};

export const actualizarMatricula = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    tomo, pagina, apellidos, nombres, cedula, sexo,
    nivelEstudio, lugarfechamatricula,
    fechaNacimiento, anioNacimiento, mesNacimiento, diaNacimiento,
    pais, provincia, canton, parroquia, ciudad,
    nacionalidad, calle, num, transversal, telefono, correo,
    nombrepapa, profesionpapa, ocupacionpapa,
    nombremama, profesionmama, ocupacionmama,
    nombrerepresentante, ocupacionrepresentante,
    domiciliorepresentante, telefonorepresentante, correoestudiante,
    cursoanterior, unidadeducativa, centroformacionanterior,
    tipoBachiller, conferidoPorA1, conferidoPorA2,
    especialidad, lugarfechacertificado
  } = req.body;

  try {
    // Solo se valida si la cédula cambia: registros antiguos con una cédula mal
    // ingresada deben poder editarse en sus otros campos sin quedar bloqueados.
    if (cedula !== undefined) {
      const actual = await prisma.matricula.findUnique({
        where: { id: Number(id) },
        select: { cedula: true }
      });
      if (actual && String(cedula).trim() !== actual.cedula) {
        const errorCedula = validarIdentificacion(cedula);
        if (errorCedula) return res.status(400).json({ error: errorCedula });
      }
    }

    const matricula = await prisma.matricula.update({
      where: { id: Number(id) },
      data: {
        tomo, pagina,
        apellidos: apellidos?.toUpperCase(),
        nombres: nombres?.toUpperCase(),
        cedula, sexo, nivelEstudio,
        lugarfechamatricula: lugarfechamatricula?.toUpperCase(),

        datosPersonales: {
          upsert: {
            create: {
              fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
              anioNacimiento, mesNacimiento, diaNacimiento,
              pais: pais?.toUpperCase(),
              provincia: provincia?.toUpperCase(),
              canton: canton?.toUpperCase(),
              parroquia: parroquia?.toUpperCase(),
              ciudad: ciudad?.toUpperCase(),
              nacionalidad: nacionalidad?.toUpperCase(),
              calle: calle?.toUpperCase(),
              num, transversal, telefono,
              correo: correo?.toLowerCase()
            },
            update: {
              fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
              anioNacimiento, mesNacimiento, diaNacimiento,
              pais: pais?.toUpperCase(),
              provincia: provincia?.toUpperCase(),
              canton: canton?.toUpperCase(),
              parroquia: parroquia?.toUpperCase(),
              ciudad: ciudad?.toUpperCase(),
              nacionalidad: nacionalidad?.toUpperCase(),
              calle: calle?.toUpperCase(),
              num, transversal, telefono,
              correo: correo?.toLowerCase()
            }
          }
        },

        datosFamiliares: {
          upsert: {
            create: {
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
              correoestudiante: correoestudiante?.toLowerCase()
            },
            update: {
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
              correoestudiante: correoestudiante?.toLowerCase()
            }
          }
        },

        datosAcademicos: {
          upsert: {
            create: {
              cursoanterior: cursoanterior?.toUpperCase(),
              unidadeducativa: unidadeducativa?.toUpperCase(),
              centroformacionanterior: centroformacionanterior?.toUpperCase(),
              tipoBachiller,
              conferidoPorA1: conferidoPorA1?.toUpperCase(),
              conferidoPorA2: conferidoPorA2?.toUpperCase(),
              especialidad: especialidad?.toUpperCase(),
              lugarfechacertificado: lugarfechacertificado?.toUpperCase()
            },
            update: {
              cursoanterior: cursoanterior?.toUpperCase(),
              unidadeducativa: unidadeducativa?.toUpperCase(),
              centroformacionanterior: centroformacionanterior?.toUpperCase(),
              tipoBachiller,
              conferidoPorA1: conferidoPorA1?.toUpperCase(),
              conferidoPorA2: conferidoPorA2?.toUpperCase(),
              especialidad: especialidad?.toUpperCase(),
              lugarfechacertificado: lugarfechacertificado?.toUpperCase()
            }
          }
        }
      },
      include: {
        curso: true,
        datosPersonales: true,
        datosFamiliares: true,
        datosAcademicos: true
      }
    });
    res.json({ message: 'Matrícula actualizada', matricula });
  } catch (error) {
    const campoLargo = mensajeCampoLargo(error);
    if (campoLargo) return res.status(400).json({ error: campoLargo });
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar matrícula' });
  }
};

export const eliminarMatricula = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.matricula.update({
      where: { id: Number(id) },
      data: { activo: false }
    });
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
        activo: true,
        OR: [
          { nombres: { contains: String(q), mode: 'insensitive' } },
          { apellidos: { contains: String(q), mode: 'insensitive' } },
          { cedula: { contains: String(q) } }
        ]
      },
      include: {
        curso: true,
        datosPersonales: true,
        datosFamiliares: true,
        datosAcademicos: true
      }
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
      include: {
        curso: { include: { materias: true } },
        datosPersonales: true,
        datosFamiliares: true,
        datosAcademicos: true
      }
    });
    if (!matricula) return res.status(404).json({ error: 'Matrícula no encontrada' });
    res.json(matricula);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener matrícula' });
  }
};