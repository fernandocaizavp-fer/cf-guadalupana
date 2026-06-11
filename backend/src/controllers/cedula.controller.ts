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

    // El servicio respondió un error (token inválido, sin saldo, etc.)
    if (!data.success) {
      const detalle = data.error || data.message || 'Error del servicio de cédulas';
      return res.status(502).json({ error: `Servicio de cédulas: ${detalle}` });
    }

    // La cédula no tiene datos (el servicio responde success pero sin nombre)
    if (!data.nombre) {
      return res.status(404).json({ error: 'No se encontraron datos para esta cédula' });
    }

    // El servicio devuelve el domicilio como "PROVINCIA/CANTON/PARROQUIA"
    const partesDomicilio = String(data.lugarDomicilio || '').split('/').map(s => s.trim());

    // Mapeamos los datos de la API a los nombres de tu formulario
    const resultado = {
      apellidos: extraerApellidos(data.nombre),
      nombres: extraerNombres(data.nombre),
      sexo: data.genero === 'HOMBRE' ? 'Masculino' : data.genero === 'MUJER' ? 'Femenino' : '',
      fechaNacimiento: formatearFecha(data.fechaNacimiento),
      nacionalidad: data.nacionalidad || 'ECUATORIANA',
      pais: 'ECUADOR',
      provincia: partesDomicilio[0] || '',
      canton: partesDomicilio[1] || '',
      parroquia: partesDomicilio[2] || '',
      calle: (data.calleDomicilio || '').trim(),
      num: (data.numeracionDomicilio || '').trim(),
      telefono: '',
      correo: '',
      nivelEstudio: (data.instruccion || '').trim(),
      nombrepapa: (data.nombrePadre || '').trim(),
      nombremama: (data.nombreMadre || '').trim()
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

// El API devuelve la fecha como DD/MM/YYYY; el formulario (input type="date") necesita YYYY-MM-DD
function formatearFecha(fecha: string): string {
  if (!fecha) return '';
  const m = fecha.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}
