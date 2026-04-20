import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import cursoRoutes from './routes/curso.routes';
import matriculaRoutes from './routes/matricula.routes';
import documentoRoutes from './routes/documento.routes';
import notaRoutes from './routes/nota.routes';
import usuarioRoutes from './routes/usuario.routes';
import tareaRoutes from './routes/tarea.routes';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/notas', notaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tareas', tareaRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Backend CF Guadalupana funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});