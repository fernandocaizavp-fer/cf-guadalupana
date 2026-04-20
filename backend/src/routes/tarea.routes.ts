import { Router } from 'express';
import {
  crearTarea, getTareasPorMateria, guardarNotasTarea,
  getNotasCursoSemestre, eliminarTarea
} from '../controllers/tarea.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, crearTarea);
router.get('/materia/:materiaId', verificarToken, getTareasPorMateria);
router.post('/notas', verificarToken, guardarNotasTarea);
router.get('/curso/:cursoId', verificarToken, getNotasCursoSemestre);
router.delete('/:id', verificarToken, eliminarTarea);

export default router;