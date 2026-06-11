import { Request, Response } from 'express';

export const consultarCedula = async (req: Request, res: Response) => {
  const { cedula } = req.params;
  const token = process.env.CEDULA_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Token de la API no configurado' });
  }
  if (!cedula || cedula.length !== 10) {
    return res.status(400).json({ error: 'Cédula inválida' });
  }

  try {
    const url = `https://apiconsult.zampisoft.com/api/consultar?token=${token}&identificacion=${cedula}&full=true`;
    const respuesta = await fetch(url);
    const data: any = await respuesta.json();

    console.log('[CEDULA] respuesta zampisoft:', JSON.stringify(data));

    // El servicio respondió un error (token inválido, sin saldo, etc.)
    if (!data.success) {
      const detalle = data.error || data.message || 'Error del servicio de cédulas';
      return res.status(502).json({ error: `Servicio de cédulas: ${detalle}`, _debug: data });
    }

    // El token funcionó pero la cédula no tiene datos
    if (!data.persona) {
      return res.status(404).json({ error: 'No se encontraron datos para esta cédula', _debug: data });
    }

    const p = data.persona;
    const dir = p.direccion || {};

    // Mapeamos los datos de la API a los nombres de tu formulario
    const resultado = {
      apellidos: extraerApellidos(p.nombre),
      nombres: extraerNombres(p.nombre),
      sexo: p.sexo === 'HOMBRE' ? 'Masculino' : p.sexo === 'MUJER' ? 'Femenino' : '',
      fechaNacimiento: p.fechas?.nacimiento || '',
      nacionalidad: p.nacionalidad || 'ECUATORIANA',
      pais: 'ECUADOR',
      provincia: dir.provincia || '',
      canton: dir.canton || '',
      parroquia: dir.parroquia || '',
      calle: dir.calle || '',
      num: dir.numeroCasa || '',
      telefono: p.celular || '',
      correo: p.email || '',
      nivelEstudio: p.instruccion || '',
      nombrepapa: p.nombrePadre || '',
      nombremama: p.nombreMadre || ''
    };

    res.json(resultado);
  } catch (error) {
    console.error('Error al consultar cédula:', error);
    res.status(500).json({ error: 'Error al consultar la cédula' });
  }
};

// El API devuelve "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2"
// Tomamos las 2 primeras palabras como apellidos y el resto como nombres
function extraerApellidos(nombreCompleto: string): string {
  if (!nombreCompleto) return '';
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes.slice(0, 2).join(' ');
}

function extraerNombres(nombreCompleto: string): string {
  if (!nombreCompleto) return '';
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes.slice(2).join(' ');
}