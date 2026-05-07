import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CursoService } from '../../../services/curso';
import { AsistenciaService } from '../../../services/asistencia';
import { TareaService } from '../../../services/tarea';
import { SuplетorioService } from '../../../services/supletorio';

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatSelectModule,
    MatFormFieldModule, MatInputModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class Reportes implements OnInit {
  cursos: any[] = [];
  seccionActiva: string | null = null;

  // Asistencia
  cursoSeleccionado: number | null = null;
  resumen: any[] = [];
  totalClases = 0;
  loading = false;
  lugarFecha = '';
  jornada = 'MATUTINA';
  observaciones: { [key: number]: string } = {};

  // Calificaciones AL14
  cursoCalificaciones: number | null = null;
  semestreCalificaciones = 1;
  resumenCalificaciones: any[] = [];
  materiasCalificaciones: any[] = [];
  loadingCalificaciones = false;
  lugarFechaCalificaciones = '';

  // Cuadro Final AL15
  cursoAL15: number | null = null;
  lugarFechaAL15 = '';
  jornadaAL15 = 'MATUTINA';

  constructor(
    private router: Router,
    private cursoService: CursoService,
    private asistenciaService: AsistenciaService,
    private tareaService: TareaService,
    private suplетorioService: SuplетorioService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cursoService.listarCursos().subscribe({
      next: (cursos: any[]) => {
        this.cursos = cursos;
        this.cdr.detectChanges();
      }
    });
  }

  abrirSeccion(seccion: string) {
    this.seccionActiva = seccion;
    this.cdr.detectChanges();
  }

  // ASISTENCIA
  seleccionarCurso() {
    if (!this.cursoSeleccionado) return;
    this.loading = true;
    this.asistenciaService.getResumenAsistenciaCurso(this.cursoSeleccionado).subscribe({
      next: (data: any) => {
        this.resumen = data.resumen;
        this.totalClases = data.totalClases;
        this.resumen.forEach(e => {
          this.observaciones[e.id] = e.observacion || '';
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarObservacion(matriculaId: number) {
    this.asistenciaService.guardarObservacion({
      matriculaId,
      cursoId: this.cursoSeleccionado,
      observacion: this.observaciones[matriculaId] || ''
    }).subscribe({
      next: () => this.snackBar.open('Observación guardada', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Error al guardar', 'OK', { duration: 2000 })
    });
  }

  descargarAL18() {
    if (!this.cursoSeleccionado || !this.lugarFecha) {
      this.snackBar.open('Completa lugar y fecha', 'OK', { duration: 3000 });
      return;
    }
    this.asistenciaService.generarAL18(this.cursoSeleccionado, this.lugarFecha, this.jornada).subscribe({
      next: (blob: Blob) => {
        const curso = this.cursos.find(c => c.id === this.cursoSeleccionado);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AL18_${curso?.ramaArtesanal || 'asistencia'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al generar AL18', 'OK', { duration: 3000 })
    });
  }

  getColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 90) return '#2e7d32';
    if (porcentaje >= 75) return '#f57f17';
    return '#c62828';
  }

  // CALIFICACIONES AL14
  seleccionarCursoCalificaciones() {
    if (!this.cursoCalificaciones) return;
    this.loadingCalificaciones = true;
    this.tareaService.getNotasCursoSemestre(this.cursoCalificaciones, this.semestreCalificaciones).subscribe({
      next: (data: any) => {
        this.materiasCalificaciones = data.materias;
        this.resumenCalificaciones = data.matriculas;
        this.loadingCalificaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingCalificaciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPromedioMateria(matricula: any, materiaId: number): string {
    const notas = matricula.notasTarea?.filter((n: any) =>
      n.tarea?.materiaId === materiaId && n.valor !== null
    ) || [];
    if (notas.length === 0) return '-';
    const suma = notas.reduce((a: number, b: any) => a + b.valor, 0);
    const prom = suma / notas.length;
    return prom % 1 === 0 ? String(prom) : prom.toFixed(1);
  }

  getPromedioGeneral(matricula: any): string {
    const notas = matricula.notasTarea?.filter((n: any) => n.valor !== null) || [];
    if (notas.length === 0) return '-';
    const suma = notas.reduce((a: number, b: any) => a + b.valor, 0);
    const prom = suma / notas.length;
    return prom % 1 === 0 ? String(prom) : prom.toFixed(1);
  }

  descargarAL14() {
    if (!this.cursoCalificaciones || !this.lugarFechaCalificaciones) {
      this.snackBar.open('Completa lugar y fecha', 'OK', { duration: 3000 });
      return;
    }
    this.tareaService.descargarAL14(this.cursoCalificaciones, this.lugarFechaCalificaciones, this.semestreCalificaciones).subscribe({
      next: (blob: Blob) => {
        const curso = this.cursos.find(c => c.id === this.cursoCalificaciones);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AL14_${curso?.ramaArtesanal}_S${this.semestreCalificaciones}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al generar AL14', 'OK', { duration: 3000 })
    });
  }

  // CUADRO FINAL AL15
  descargarAL15() {
    if (!this.cursoAL15 || !this.lugarFechaAL15) {
      this.snackBar.open('Selecciona curso y completa lugar y fecha', 'OK', { duration: 3000 });
      return;
    }
    this.suplетorioService.generarAL15(this.cursoAL15, this.lugarFechaAL15, this.jornadaAL15).subscribe({
      next: (blob: Blob) => {
        const curso = this.cursos.find(c => c.id === this.cursoAL15);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AL15_${curso?.ramaArtesanal || 'cuadro_final'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al generar AL15', 'OK', { duration: 3000 })
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}