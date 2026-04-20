import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { UsuarioService } from '../../../services/usuario';
import { CursoService } from '../../../services/curso';

@Component({
  selector: 'app-gestion-docentes',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatTableModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatSelectModule, MatDividerModule],
  templateUrl: './gestion-docentes.html',
  styleUrl: './gestion-docentes.scss'
})
export class GestionDocentes implements OnInit {
  docentes: any[] = [];
  cursos: any[] = [];
  loading = true;
  guardando = false;
  columnas = ['nombre', 'apellido', 'correo', 'acciones'];

  nuevoDocente = {
    nombre: '',
    apellido: '',
    correo: '',
    password: ''
  };

  asignacion = {
    cursoId: '',
    materiaId: '',
    profesorId: ''
  };

  materiasCurso: any[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private cursoService: CursoService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDocentes();
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => { this.cursos = cursos; this.cdr.detectChanges(); }
    });
  }

  cargarDocentes() {
    this.loading = true;
    this.usuarioService.listarDocentes().subscribe({
      next: (docentes) => {
        this.docentes = docentes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  crearDocente() {
    if (!this.nuevoDocente.nombre || !this.nuevoDocente.correo || !this.nuevoDocente.password) {
      this.snackBar.open('Completa todos los campos', 'OK', { duration: 3000 });
      return;
    }
    this.guardando = true;
    this.usuarioService.crearDocente(this.nuevoDocente).subscribe({
      next: () => {
        this.snackBar.open('Docente creado exitosamente', 'OK', { duration: 3000 });
        this.nuevoDocente = { nombre: '', apellido: '', correo: '', password: '' };
        this.guardando = false;
        this.cargarDocentes();
      },
      error: (err) => {
        this.guardando = false;
        this.snackBar.open(err.error?.error || 'Error al crear docente', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarDocente(id: number) {
    if (confirm('¿Eliminar este docente?')) {
      this.usuarioService.eliminarDocente(id).subscribe({
        next: () => {
          this.snackBar.open('Docente eliminado', 'OK', { duration: 3000 });
          this.cargarDocentes();
        },
        error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    }
  }

  onCursoChange() {
    this.asignacion.materiaId = '';
    this.materiasCurso = [];
    if (this.asignacion.cursoId) {
      this.cursoService.obtenerCurso(Number(this.asignacion.cursoId)).subscribe({
        next: (curso) => {
          this.materiasCurso = curso.materias || [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  asignarProfesor() {
    if (!this.asignacion.cursoId || !this.asignacion.materiaId || !this.asignacion.profesorId) {
      this.snackBar.open('Selecciona curso, materia y docente', 'OK', { duration: 3000 });
      return;
    }
    this.usuarioService.asignarProfesor(
      Number(this.asignacion.materiaId),
      Number(this.asignacion.profesorId)
    ).subscribe({
      next: () => {
        this.snackBar.open('Profesor asignado exitosamente', 'OK', { duration: 3000 });
        this.asignacion = { cursoId: '', materiaId: '', profesorId: '' };
        this.materiasCurso = [];
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Error al asignar', 'OK', { duration: 3000 })
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}