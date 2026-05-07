import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-ingresar-disciplina',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatFormFieldModule, MatInputModule],
  templateUrl: './ingresar-disciplina.html',
  styleUrl: './ingresar-disciplina.scss'
})
export class IngresarDisciplina implements OnInit {
  materiaId: number = 0;
  materia: any = null;
  matriculas: any[] = [];
  notas: { [key: number]: string } = {};
  loading = true;
  guardando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit() {
  this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authService.getToken()}`
  });

  this.http.get<any>(`http://localhost:3001/api/disciplina/estudiantes/${this.materiaId}`, { headers }).subscribe({
    next: (data) => {
      this.materia = data.materia;
      this.matriculas = data.matriculas;

      this.http.get<any[]>(`http://localhost:3001/api/disciplina/materia/${this.materiaId}`, { headers }).subscribe({
        next: (notasExistentes) => {
          notasExistentes.forEach(n => {
            this.notas[n.matriculaId] = String(n.valor);
          });
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: () => {
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  cargarMatriculas(headers: HttpHeaders) {
    // Obtener la materia para saber el cursoId
    this.http.get<any[]>(`http://localhost:3001/api/tareas/${this.materiaId}`, { headers }).subscribe({
      next: (tareas) => {
        const cursoId = tareas[0]?.materia?.cursoId;
        if (!cursoId) {
          // Sin tareas aún — obtener materia directo
          this.cargarMatriculasPorMateria(headers);
          return;
        }
        this.cargarEstudiantesCurso(cursoId, headers);
      },
      error: () => {
        this.cargarMatriculasPorMateria(headers);
      }
    });
  }

  cargarMatriculasPorMateria(headers: HttpHeaders) {
    this.http.get<any>(`http://localhost:3001/api/asistencias/materia/${this.materiaId}`, { headers }).subscribe({
      next: (data) => {
        const cursoId = data[0]?.materia?.cursoId;
        if (cursoId) this.cargarEstudiantesCurso(cursoId, headers);
        else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarEstudiantesCurso(cursoId: number, headers: HttpHeaders) {
    this.http.get<any>(`http://localhost:3001/api/cursos/${cursoId}`, { headers }).subscribe({
      next: (curso) => {
        this.materia = curso.materias?.find((m: any) => m.id === this.materiaId);
        this.matriculas = curso.matriculas || [];

        // Cargar notas existentes
        this.http.get<any[]>(`http://localhost:3001/api/disciplina/materia/${this.materiaId}`, { headers }).subscribe({
          next: (notasExistentes) => {
            notasExistentes.forEach(n => {
              this.notas[n.matriculaId] = String(n.valor);
            });
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardar() {
    const notasArray = this.matriculas
      .filter(m => this.notas[m.id] !== undefined && this.notas[m.id] !== '')
      .map(m => ({
        matriculaId: m.id,
        materiaId: this.materiaId,
        valor: Number(this.notas[m.id])
      }));

    if (notasArray.length === 0) {
      this.snackBar.open('Ingresa al menos una nota', 'OK', { duration: 3000 });
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.guardando = true;
    this.cdr.detectChanges();

    this.http.post(`http://localhost:3001/api/disciplina/masivo`, { notas: notasArray }, { headers }).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Notas de disciplina guardadas', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  volver() {
    this.router.navigate(['/profesor']);
  }
}