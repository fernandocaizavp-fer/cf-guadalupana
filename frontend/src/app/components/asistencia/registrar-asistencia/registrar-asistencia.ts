import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { AsistenciaService } from '../../../services/asistencia';
import { TareaService } from '../../../services/tarea';
import { CursoService } from '../../../services/curso';

@Component({
  selector: 'app-registrar-asistencia',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  templateUrl: './registrar-asistencia.html',
  styleUrl: './registrar-asistencia.scss'
})
export class RegistrarAsistencia implements OnInit {
  materiaId = 0;
  materia: any = null;
  matriculas: any[] = [];
  asistencias: any[] = [];
  loading = true;
  guardando = false;
  fecha = new Date().toISOString().split('T')[0];

  // presentes[matriculaId] = true/false
  presentes: { [key: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asistenciaService: AsistenciaService,
    private tareaService: TareaService,
    private cursoService: CursoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.cargarDatos();
  }

  cargarDatos() {
    this.tareaService.getTareasPorMateria(this.materiaId).subscribe({
      next: (tareas) => {
        if (tareas.length > 0) {
          this.materia = tareas[0].materia;
          const cursoId = tareas[0].materia?.curso?.id;
          if (cursoId) {
            this.cursoService.obtenerCurso(cursoId).subscribe({
              next: (curso) => {
                this.matriculas = curso.matriculas || [];
                this.marcarTodos();
                this.cargarAsistencias();
              }
            });
          }
        } else {
          // Si no hay tareas buscar la materia directamente
          this.cargarPorCursoService();
        }
      },
      error: () => this.cargarPorCursoService()
    });
  }

  cargarPorCursoService() {
    // Fallback — obtener curso desde el materiaId
    this.loading = false;
    this.cdr.detectChanges();
  }

  cargarAsistencias() {
    this.asistenciaService.getAsistenciasPorMateria(this.materiaId).subscribe({
      next: (asistencias) => {
        this.asistencias = asistencias;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  marcarTodos() {
    this.matriculas.forEach(m => {
      this.presentes[m.id] = true;
    });
  }

  desmarcarTodos() {
    this.matriculas.forEach(m => {
      this.presentes[m.id] = false;
    });
  }

  togglePresente(matriculaId: number) {
    this.presentes[matriculaId] = !this.presentes[matriculaId];
    this.cdr.detectChanges();
  }

  get totalPresentes(): number {
    return Object.values(this.presentes).filter(v => v).length;
  }

  get totalAusentes(): number {
    return Object.values(this.presentes).filter(v => !v).length;
  }

  guardar() {
    if (!this.fecha) {
      this.snackBar.open('Selecciona una fecha', 'OK', { duration: 3000 });
      return;
    }
    this.guardando = true;
    const detalles = this.matriculas.map(m => ({
      matriculaId: m.id,
      presente: this.presentes[m.id] ?? true
    }));

    this.asistenciaService.crearAsistencia({
      fecha: this.fecha,
      materiaId: this.materiaId,
      detalles
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Asistencia registrada exitosamente', 'OK', { duration: 3000 });
        this.cargarAsistencias();
        this.marcarTodos();
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al registrar asistencia', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarAsistencia(id: number) {
    if (confirm('¿Eliminar este registro de asistencia?')) {
      this.asistenciaService.eliminarAsistencia(id).subscribe({
        next: () => {
          this.snackBar.open('Registro eliminado', 'OK', { duration: 3000 });
          this.cargarAsistencias();
        },
        error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    }
  }

  contarPresentes(asistencia: any): number {
    return asistencia.detalles?.filter((d: any) => d.presente)?.length || 0;
  }

  contarAusentes(asistencia: any): number {
    return asistencia.detalles?.filter((d: any) => !d.presente)?.length || 0;
  }

  volver() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.rol === 'PROFESOR') {
      this.router.navigate(['/profesor']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}