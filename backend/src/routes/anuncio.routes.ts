import { Router } from 'express';
import { crearAnuncio, listarAnuncios, listarTodosAnuncios, actualizarAnuncio, eliminarAnuncio, upload } from '../controllers/anuncio.controller';
import { verificarToken, soloAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verificarToken, listarAnuncios);
router.get('/todos', verificarToken, soloAdmin, listarTodosAnuncios);
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), crearAnuncio);
router.put('/:id', verificarToken, soloAdmin, upload.single('imagen'), actualizarAnuncio);
router.delete('/:id', verificarToken, soloAdmin, eliminarAnuncio);

export default router;