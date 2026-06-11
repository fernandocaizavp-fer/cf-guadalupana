import { Router } from 'express';
import {
  crearTarea, getTareasPorMateria, guardarNotasTarea,
  getNotasCursoSemestre, eliminarTarea
} from '../controllers/tarea.controller';
import { verificarToken, soloRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, soloRoles('ADMIN', 'PROFESOR'), crearTarea);
router.get('/materia/:materiaId', verificarToken, getTareasPorMateria);
router.post('/notas', verificarToken, soloRoles('ADMIN', 'PROFESOR'), guardarNotasTarea);
router.get('/curso/:cursoId', verificarToken, getNotasCursoSemestre);
router.delete('/:id', verificarToken, soloRoles('ADMIN', 'PROFESOR'), eliminarTarea);

export default router;