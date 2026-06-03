import { Router } from 'express';
import { login, crearAdmin, cambiarPassword, solicitarRecuperacion, restablecerPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/crear-admin', crearAdmin);
router.post('/cambiar-password', cambiarPassword);
router.post('/solicitar-recuperacion', solicitarRecuperacion);
router.post('/restablecer-password', restablecerPassword);

export default router;