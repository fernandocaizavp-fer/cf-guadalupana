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

  // Consulta un nivel de la API. full=true → "Cédula Full Data" ($0.05, con
  // padres/dirección/instrucción); full=false → "Cédula Básica" ($0.02).
  const consultarNivel = async (full: boolean): Promise<any> => {
    const url = `https://apiconsult.zampisoft.com/api/consultar?token=${token}&identificacion=${cedula}&full=${full}`;
    const respuesta = await fetch(url);
    return respuesta.json();
  };

  try {
    // 1) Nivel Full: trae los datos ampliados (padres, dirección, instrucción).
    let data: any = await consultarNivel(true);

    // Error real del servicio (token inválido, sin saldo, etc.): no reintentamos
    // en Básica porque también fallaría y gastaría saldo.
    if (!data.success) {
      const detalle = data.error || data.message || 'Error del servicio de cédulas';
      return res.status(502).json({ error: `Servicio de cédulas: ${detalle}` });
    }

    // 2) Consulta híbrida: si Full respondió pero sin datos, reintentamos en
    //    Básica ($0.02). Algunas cédulas existen en el nivel Básico pero no en
    //    el Full, así que este respaldo evita el falso "no encontrado".
    if (!data.nombre) {
      const basica: any = await consultarNivel(false);
      if (basica.success && basica.nombre) {
        data = basica;
      }
    }

    // 3) Si ni Full ni Básica tienen nombre, realmente no hay datos.
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
