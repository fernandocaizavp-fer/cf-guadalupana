import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TareaService } from '../../../services/tarea';

@Component({
  selector: 'app-detalle-tarea',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  templateUrl: './detalle-tarea.html',
  styleUrl: './detalle-tarea.scss'
})
export class DetalleTarea implements OnInit {
  materiaId = 0;
  tareaId = 0;
  tarea: any = null;
  entregas: any[] = [];
  loading = true;
  subiendo = false;

  private readonly MAX_BYTES = 10 * 1024 * 1024;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.tareaId = Number(this.route.snapshot.paramMap.get('tareaId'));
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.tareaService.getTareasPorMateria(this.materiaId).subscribe({
      next: (tareas) => {
        this.tarea = tareas.find((t: any) => t.id === this.tareaId) || null;
        this.cargarEntregas();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarEntregas() {
    this.tareaService.getEntregasTarea(this.tareaId).subscribe({
      next: (entregas) => {
        this.entregas = entregas;
        this.cdr.detectChanges();
      }
    });
  }

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

  calificar() {
    this.router.navigate(['/tareas', this.materiaId, 'notas', this.tareaId]);
  }

  volver() {
    this.router.navigate(['/tareas', this.materiaId]);
  }
}
