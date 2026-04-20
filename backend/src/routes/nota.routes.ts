import { Router } from 'express';
import { getNotasCurso, guardarNota, guardarNotasMasivo, descargarAL14 } from '../controllers/nota.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/curso/:cursoId', verificarToken, getNotasCurso);
router.post('/', verificarToken, guardarNota);
router.post('/masivo', verificarToken, guardarNotasMasivo);
router.get('/al14/:cursoId', verificarToken, descargarAL14);

export default router;