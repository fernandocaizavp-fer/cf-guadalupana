import { Router } from 'express';
import { guardarSupletorio, guardarSupletoriosMasivo, generarAL15 } from '../controllers/supletorio.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, guardarSupletorio);
router.post('/masivo', verificarToken, guardarSupletoriosMasivo);
router.get('/al15/:cursoId', verificarToken, generarAL15);

export default router;