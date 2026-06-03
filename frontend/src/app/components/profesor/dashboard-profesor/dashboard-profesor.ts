import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard-profesor',
  standalone: true,
  imports: [
    MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatSnackBarModule, DatePipe
  ],
  templateUrl: './dashboard-profesor.html',
  styleUrl: './dashboard-profesor.scss'
})
export class DashboardProfesor implements OnInit {
  usuario: any;
  cursosAgrupados: any[] = [];
  anuncios: any[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.usuario = this.authService.getUsuario();
  }

  ngOnInit() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.get<any[]>(`http://localhost:3001/api/usuarios/mis-materias/${this.usuario.id}`, { headers }).subscribe({
      next: (materias) => {
        const mapa: { [key: number]: any } = {};

        materias.forEach(m => {
          console.log(m.nombre, m.id, m.materiaParent, m.tieneDisciplina);

          if (!mapa[m.cursoId]) {
            mapa[m.cursoId] = {
              id: m.cursoId,
              ramaArtesanal: m.curso?.ramaArtesanal,
              anioFormativo: m.curso?.anioFormativo,
              materias: []
            };
          }

          if (!m.esSubmateria && (m.nombre === 'Práctica' || m.nombre === 'Teoría')) {
            return;
          }

          if (m.esSubmateria) {
            const yaExiste = mapa[m.cursoId].materias.find(
              (x: any) => x.esSubmateria && x.nombre === m.nombre
            );
            if (yaExiste) {
              yaExiste.idGemela = m.id;
              if (m.tieneDisciplina) yaExiste.tieneDisciplina = true;
              return;
            }
          }

          mapa[m.cursoId].materias.push(m);
        });

        this.cursosAgrupados = Object.values(mapa);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error al cargar materias', 'OK', { duration: 3000 });
      }
    });

    this.http.get<any[]>('http://localhost:3001/api/anuncios', { headers }).subscribe({
      next: (anuncios) => {
        this.anuncios = anuncios;
        this.cdr.detectChanges();
      }
    });
  }

  irAAsistencia(materiaId: number) {
    this.router.navigate(['/asistencia/materia', materiaId]);
  }

  irANotas(cursoId: number, materiaId?: number) {
    if (materiaId) {
      this.router.navigate(['/tareas', materiaId]);
    } else {
      this.router.navigate(['/cursos', cursoId, 'notas']);
    }
  }

  irASupletorio(materiaId: number) {
    this.router.navigate(['/supletorios/materia', materiaId]);
  }

  irAExamenGrado(materiaId: number) {
    this.router.navigate(['/examen-grado', materiaId]);
  }

  irADisciplina(materiaId: number) {
    this.router.navigate(['/disciplina/materia', materiaId]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}