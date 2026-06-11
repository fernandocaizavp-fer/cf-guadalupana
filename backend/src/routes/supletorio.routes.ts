import { Router } from 'express';
import { guardarSupletorio, guardarSupletoriosMasivo, generarAL15, generarAL19 } from '../controllers/supletorio.controller';
import { verificarToken, soloRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', verificarToken, soloRoles('ADMIN', 'PROFESOR'), guardarSupletorio);
router.post('/masivo', verificarToken, soloRoles('ADMIN', 'PROFESOR'), guardarSupletoriosMasivo);
router.get('/al15/:cursoId', verificarToken, generarAL15);
router.get('/al19/:cursoId', verificarToken, generarAL19);

export default router;