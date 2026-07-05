import { Router } from 'express';
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  habilitarSupletorioIndividual,
  revocarSupletorioIndividual,
  listarPermisosSupletorio
} from '../controllers/configuracion.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verificarToken, obtenerConfiguracion);
router.put('/', verificarToken, soloAdmin, actualizarConfiguracion);
router.get('/permisos-supletorio', verificarToken, soloAdmin, listarPermisosSupletorio);
router.post('/permiso-supletorio', verificarToken, soloAdmin, habilitarSupletorioIndividual);
router.delete('/permiso-supletorio/:matriculaId', verificarToken, soloAdmin, revocarSupletorioIndividual);

export default router;
