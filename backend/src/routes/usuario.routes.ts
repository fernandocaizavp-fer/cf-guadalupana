import { Router } from 'express';
import {
  crearDocente, listarDocentes, eliminarDocente, actualizarDocente,
  asignarProfesor, asignarProfesorPrincipalMateria,
  getMisMateria, getPerfilEstudiante
} from '../controllers/usuario.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/docentes', verificarToken, soloAdmin, crearDocente);
router.get('/docentes', verificarToken, soloAdmin, listarDocentes);
router.put('/docentes/:id', verificarToken, soloAdmin, actualizarDocente);
router.delete('/docentes/:id', verificarToken, soloAdmin, eliminarDocente);
router.post('/asignar-materia', verificarToken, soloAdmin, asignarProfesor);
router.post('/asignar-profesor-principal-materia', verificarToken, soloAdmin, asignarProfesorPrincipalMateria);
router.get('/mis-materias/:profesorId', verificarToken, getMisMateria);
router.get('/perfil-estudiante/:usuarioId', verificarToken, getPerfilEstudiante);

export default router;