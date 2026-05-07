import { Router } from 'express';
import {
  crearAsistencia, getAsistenciasPorMateria, getResumenAsistenciaCurso,
  guardarObservacion, eliminarAsistencia, generarAL18
} from '../controllers/asistencia.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, crearAsistencia);
router.get('/materia/:materiaId', verificarToken, getAsistenciasPorMateria);
router.get('/resumen/:cursoId', verificarToken, getResumenAsistenciaCurso);
router.post('/observacion', verificarToken, guardarObservacion);
router.delete('/:id', verificarToken, eliminarAsistencia);
router.get('/al18/:cursoId', verificarToken, generarAL18);

export default router;