import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TareaService } from '../../../services/tarea';
import { CursoService } from '../../../services/curso';
import { ConfiguracionService } from '../../../services/configuracion';

@Component({
  selector: 'app-detalle-tarea',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  templateUrl: './detalle-tarea.html',
  styleUrl: './detalle-tarea.scss'
})
export class DetalleTarea implements OnInit {
  materiaId = 0;
  tareaId = 0;
  tarea: any = null;
  estudiantes: any[] = [];
  notas: { [key: number]: { valor: string; observacion: string } } = {};
  loading = true;
  subiendo = false;
  guardando = false;
  notaMin = 0;
  notaMax = 10;

  private readonly MAX_BYTES = 10 * 1024 * 1024;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private cursoService: CursoService,
    private configService: ConfiguracionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.tareaId = Number(this.route.snapshot.paramMap.get('tareaId'));
    this.configService.obtener().subscribe({
      next: (c) => { this.notaMin = c.notaMinima; this.notaMax = c.notaMaxima; }
    });
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.tareaService.getTareasPorMateria(this.materiaId).subscribe({
      next: (tareas) => {
        this.tarea = tareas.find((t: any) => t.id === this.tareaId) || null;
        const cursoId = this.tarea?.materia?.curso?.id || this.tarea?.materia?.cursoId;
        if (cursoId) {
          this.cargarEstudiantes(cursoId);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private cargarEstudiantes(cursoId: number) {
    // Estudiantes del curso + entregas de la tarea (para mostrar y calificar juntos)
    this.cursoService.obtenerCurso(cursoId).subscribe({
      next: (curso) => {
        const matriculas = curso.matriculas || [];
        this.tareaService.getEntregasTarea(this.tareaId).subscribe({
          next: (entregas) => {
            const mapaEntregas = new Map<number, any>(entregas.map((e: any) => [e.matriculaId, e]));
            this.estudiantes = matriculas.map((m: any) => {
              const notaExistente = this.tarea.notas?.find((n: any) => n.matriculaId === m.id);
              this.notas[m.id] = {
                valor: notaExistente?.valor !== null && notaExistente?.valor !== undefined
                  ? String(notaExistente.valor) : '',
                observacion: notaExistente?.observacion || ''
              };
              return { ...m, entrega: mapaEntregas.get(m.id) || null };
            });
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  guardarCalificaciones() {
    this.guardando = true;
    const notasArray = this.estudiantes.map(e => ({
      tareaId: this.tareaId,
      matriculaId: e.id,
      valor: this.notas[e.id]?.valor !== '' ? this.notas[e.id]?.valor : null,
      observacion: this.notas[e.id]?.observacion || null
    }));
    this.tareaService.guardarNotas(notasArray).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Calificaciones guardadas', 'OK', { duration: 2500 });
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.guardando = false;
        this.snackBar.open(e?.error?.error || 'Error al guardar calificaciones', 'OK', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- Documentos de la tarea ----------
  onArchivosSeleccionados(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    const grande = files.find(f => f.size > this.MAX_BYTES);
    if (grande) {
      this.snackBar.open(`El archivo ${grande.name} supera el tamaño máximo de 10 MB`, 'OK', { duration: 4000 });
      input.value = '';
      return;
    }

    this.subiendo = true;
    this.tareaService.subirArchivosTarea(this.tareaId, files).subscribe({
      next: (res) => {
        this.tarea.archivos = [...(this.tarea.archivos || []), ...res.archivos];
        this.subiendo = false;
        input.value = '';
        this.snackBar.open('Archivos subidos', 'OK', { duration: 2500 });
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.subiendo = false;
        input.value = '';
        this.snackBar.open(e?.error?.error || 'Error al subir archivos', 'OK', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarArchivo(archivo: any) {
    if (!confirm(`¿Eliminar "${archivo.nombreOriginal}"?`)) return;
    this.tareaService.eliminarArchivoTarea(archivo.id).subscribe({
      next: () => {
        this.tarea.archivos = (this.tarea.archivos || []).filter((a: any) => a.id !== archivo.id);
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Error al eliminar archivo', 'OK', { duration: 3000 })
    });
  }

  volver() {
    this.router.navigate(['/tareas', this.materiaId]);
  }
}
