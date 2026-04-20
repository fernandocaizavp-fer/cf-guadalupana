import { Router } from 'express';
import { login, crearAdmin } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/crear-admin', crearAdmin);

export default router;