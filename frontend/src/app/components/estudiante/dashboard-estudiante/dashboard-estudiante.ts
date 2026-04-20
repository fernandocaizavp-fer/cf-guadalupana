import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../services/auth';
import { MatriculaService } from '../../../services/matricula';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-estudiante',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule],
  templateUrl: './dashboard-estudiante.html',
  styleUrl: './dashboard-estudiante.scss'
})
export class DashboardEstudiante implements OnInit {
  usuario: any;
  matricula: any = null;
  loading = true;
  semestreSeleccionado = 1;
  materiasConTareas: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private matriculaService: MatriculaService,
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

    this.http.get(`http://localhost:3001/api/usuarios/perfil-estudiante/${this.usuario.id}`, { headers }).subscribe({
      next: (matricula: any) => {
        this.matricula = matricula;
        this.cargarNotasSemestre();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarNotasSemestre() {
    if (!this.matricula?.cursoId) return;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.get<any>(
      `http://localhost:3001/api/tareas/curso/${this.matricula.cursoId}?semestre=${this.semestreSeleccionado}`,
      { headers }
    ).subscribe({
      next: (data) => {
        // Armar materias con tareas y notas del estudiante
        this.materiasConTareas = data.materias.map((materia: any) => {
          const tareasConNota = materia.tareas.map((tarea: any) => {
            const notaTarea = this.matricula.notasTarea?.find(
              (n: any) => n.tarea?.materiaId === materia.id && n.tareaId === tarea.id
            );
            return {
              ...tarea,
              miNota: notaTarea?.valor ?? null,
              miObservacion: notaTarea?.observacion || ''
            };
          });

          const notasValidas = tareasConNota.filter((t: any) => t.miNota !== null);
          const promedio = notasValidas.length > 0
            ? notasValidas.reduce((a: number, b: any) => a + b.miNota, 0) / notasValidas.length
            : null;

          return {
            ...materia,
            tareas: tareasConNota,
            promedio: promedio !== null
              ? (promedio % 1 === 0 ? String(promedio) : promedio.toFixed(1))
              : '-'
          };
        }).filter((m: any) => m.tareas.length > 0);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarSemestre(semestre: number) {
    this.semestreSeleccionado = semestre;
    this.loading = true;
    this.cargarNotasSemestre();
  }

  verDetalleMateria(materiaId: number) {
    this.router.navigate(['/estudiante/materia', materiaId, this.semestreSeleccionado]);
  }

  descargarCertificado() {
    if (!this.matricula) return;
    this.matriculaService.descargarCertificado(this.matricula.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_${this.matricula.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al descargar certificado', 'OK', { duration: 3000 })
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}