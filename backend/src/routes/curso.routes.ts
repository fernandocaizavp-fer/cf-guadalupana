import { Router } from 'express';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';
import { crearCurso, listarCursos, obtenerCurso, eliminarCurso } from '../controllers/curso.controller';

const router = Router();

router.post('/', verificarToken, soloAdmin, crearCurso);
router.get('/', verificarToken, listarCursos);
router.get('/:id', verificarToken, obtenerCurso);
router.delete('/:id', verificarToken, soloAdmin, eliminarCurso);

export default router;