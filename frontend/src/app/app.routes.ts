import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { NuevaMatricula } from './components/matriculas/nueva-matricula/nueva-matricula';
import { ListaCursos } from './components/cursos/lista-cursos/lista-cursos';
import { NuevoCurso } from './components/cursos/nuevo-curso/nuevo-curso';
import { DetalleCurso } from './components/cursos/detalle-curso/detalle-curso';
import { Landing } from './components/landing/landing';
import { NotasCurso } from './components/notas/notas-curso/notas-curso';
import { AuthGuard } from './guards/auth.guard';
import { DashboardProfesor } from './components/profesor/dashboard-profesor/dashboard-profesor';
import { DashboardEstudiante } from './components/estudiante/dashboard-estudiante/dashboard-estudiante';
import { GestionDocentes } from './components/usuarios/gestion-docentes/gestion-docentes';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'cursos', component: ListaCursos, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'cursos/nuevo', component: NuevoCurso, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'cursos/:id', component: DetalleCurso, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'cursos/:id/notas', component: NotasCurso, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'PROFESOR'] } },
  { path: 'matriculas/nueva', component: NuevaMatricula, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'profesor', component: DashboardProfesor, canActivate: [AuthGuard], data: { roles: ['PROFESOR'] } },
  { path: 'estudiante', component: DashboardEstudiante, canActivate: [AuthGuard], data: { roles: ['ESTUDIANTE'] } },
  { path: 'docentes', component: GestionDocentes, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
];