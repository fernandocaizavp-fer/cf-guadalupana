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
  materiaPracticaId: number = 0;
  materiaTeoriaId: number = 0;
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
        this.materiaPracticaId = data.materiaPracticaId || 0;
        this.materiaTeoriaId = data.materiaTeoriaId || 0;

        // Cargar notas existentes — buscar por Práctica o Teoría
        const idBusqueda = this.materiaPracticaId || this.materiaTeoriaId || this.materiaId;
        this.http.get<any[]>(`http://localhost:3001/api/disciplina/materia/${idBusqueda}`, { headers }).subscribe({
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
    const notasArray: any[] = [];

    this.matriculas
      .filter(m => this.notas[m.id] !== undefined && this.notas[m.id] !== '')
      .forEach(m => {
        const valor = Number(this.notas[m.id]);
        if (this.materiaPracticaId) {
          notasArray.push({ matriculaId: m.id, materiaId: this.materiaPracticaId, valor });
        }
        if (this.materiaTeoriaId) {
          notasArray.push({ matriculaId: m.id, materiaId: this.materiaTeoriaId, valor });
        }
        if (!this.materiaPracticaId && !this.materiaTeoriaId) {
          notasArray.push({ matriculaId: m.id, materiaId: this.materiaId, valor });
        }
      });

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