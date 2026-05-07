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
  editando: any = null;
  columnas = ['nombre', 'apellido', 'correo', 'cedula', 'acciones'];

  nuevoDocente = {
    nombre: '',
    apellido: '',
    correo: '',
    cedula: ''
  };

  asignacion = {
    cursoId: '',
    materiaId: '',
    profesorId: ''
  };

  asignacionPrincipal = {
    cursoId: '',
    materiaId: '',
    profesorId: ''
  };

  materiasCurso: any[] = [];
  materiasPrincipal: any[] = [];

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
    if (!this.nuevoDocente.nombre || !this.nuevoDocente.correo || !this.nuevoDocente.cedula) {
      this.snackBar.open('Nombre, correo y cédula son obligatorios', 'OK', { duration: 3000 });
      return;
    }
    this.guardando = true;
    this.cdr.detectChanges();

    const request = this.editando
      ? this.usuarioService.actualizarDocente(this.editando.id, this.nuevoDocente)
      : this.usuarioService.crearDocente(this.nuevoDocente);

    request.subscribe({
      next: () => {
        this.snackBar.open(this.editando ? 'Docente actualizado' : 'Docente creado exitosamente', 'OK', { duration: 3000 });
        this.nuevoDocente = { nombre: '', apellido: '', correo: '', cedula: '' };
        this.editando = null;
        this.guardando = false;
        this.cargarDocentes();
      },
      error: (err) => {
        this.guardando = false;
        this.snackBar.open(err.error?.error || 'Error al guardar docente', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  editarDocente(docente: any) {
    this.editando = docente;
    this.nuevoDocente = {
      nombre: docente.nombre,
      apellido: docente.apellido,
      correo: docente.correo,
      cedula: docente.cedula || ''
    };
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.editando = null;
    this.nuevoDocente = { nombre: '', apellido: '', correo: '', cedula: '' };
    this.cdr.detectChanges();
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
          const vistas = new Set<string>();
          this.materiasCurso = (curso.materias || []).filter((m: any) => {
            if (!m.esSubmateria) return true;
            const key = m.nombre;
            if (vistas.has(key)) return false;
            vistas.add(key);
            return true;
          });
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

    const materiaSeleccionada = this.materiasCurso.find(
      (m: any) => m.id === Number(this.asignacion.materiaId)
    );

    if (materiaSeleccionada?.esSubmateria) {
      // Buscar la materia gemela (mismo nombre, diferente parent)
      this.cursoService.obtenerCurso(Number(this.asignacion.cursoId)).subscribe({
        next: (curso) => {
          const gemelas = curso.materias.filter((m: any) =>
            m.esSubmateria && m.nombre === materiaSeleccionada.nombre
          );
          let completados = 0;
          gemelas.forEach((m: any) => {
            this.usuarioService.asignarProfesor(m.id, Number(this.asignacion.profesorId)).subscribe({
              next: () => {
                completados++;
                if (completados === gemelas.length) {
                  this.snackBar.open('Profesor asignado a Práctica y Teoría', 'OK', { duration: 3000 });
                  this.asignacion = { cursoId: '', materiaId: '', profesorId: '' };
                  this.materiasCurso = [];
                  this.cdr.detectChanges();
                }
              },
              error: () => this.snackBar.open('Error al asignar', 'OK', { duration: 3000 })
            });
          });
        }
      });
    } else {
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
  }

    onCursoPrincipalChange() {
    this.asignacionPrincipal.materiaId = '';
    this.materiasPrincipal = [];
    if (this.asignacionPrincipal.cursoId) {
      this.cursoService.obtenerCurso(Number(this.asignacionPrincipal.cursoId)).subscribe({
        next: (curso) => {
          this.materiasPrincipal = curso.materias.filter((m: any) =>
            m.nombre === 'Práctica' || m.nombre === 'Teoría'
          );
          this.cdr.detectChanges();
        }
      });
    }
  }

asignarProfesorPrincipal() {
  if (!this.asignacionPrincipal.materiaId || !this.asignacionPrincipal.profesorId) {
    this.snackBar.open('Selecciona materia y docente', 'OK', { duration: 3000 });
    return;
  }
  this.usuarioService.asignarProfesorPrincipalMateria(
    Number(this.asignacionPrincipal.materiaId),
    Number(this.asignacionPrincipal.profesorId)
  ).subscribe({
    next: () => {
      this.snackBar.open('Profesor principal asignado', 'OK', { duration: 3000 });
      this.asignacionPrincipal = { cursoId: '', materiaId: '', profesorId: '' };
      this.materiasPrincipal = [];
      this.cdr.detectChanges();
    },
    error: () => this.snackBar.open('Error al asignar', 'OK', { duration: 3000 })
  });
}

  volver() {
    this.router.navigate(['/dashboard']);
  }
}