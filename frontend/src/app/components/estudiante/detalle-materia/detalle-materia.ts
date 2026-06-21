import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { TareaService } from '../../../services/tarea';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-detalle-materia',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './detalle-materia.html',
  styleUrl: './detalle-materia.scss'
})
export class DetalleMateria implements OnInit {
  materiaId = 0;
  semestre = 1;
  materia: any = null;
  tareas: any[] = [];
  promedio = '-';
  loading = true;
  usuario: any;
  matriculaId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tareaService: TareaService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.usuario = this.authService.getUsuario();
  }

  private readonly MAX_BYTES = 10 * 1024 * 1024;

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.semestre = Number(this.route.snapshot.paramMap.get('semestre'));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    // Obtener perfil del estudiante para tener el matriculaId
    this.http.get<any>(
      `https://cf-guadalupana-production.up.railway.app/api/usuarios/perfil-estudiante/${this.usuario.id}`,
      { headers }
    ).subscribe({
      next: (matricula) => {
        this.matriculaId = matricula.id;
        this.cargarTareas();
      }
    });
  }

  cargarTareas() {
    this.tareaService.getTareasPorMateria(this.materiaId, this.semestre).subscribe({
      next: (tareas) => {
        if (tareas.length > 0) {
          this.materia = tareas[0].materia;
        }

        // Filtrar notas del estudiante
        this.tareas = tareas.map(tarea => {
          const miNota = tarea.notas?.find((n: any) => n.matriculaId === this.matriculaId);
          return {
            ...tarea,
            miNota: miNota?.valor ?? null,
            miObservacion: miNota?.observacion || ''
          };
        });

        // Calcular promedio
        const notasValidas = this.tareas.filter(t => t.miNota !== null);
        if (notasValidas.length > 0) {
          const suma = notasValidas.reduce((a, b) => a + b.miNota, 0);
          const prom = suma / notasValidas.length;
          this.promedio = prom % 1 === 0 ? String(prom) : prom.toFixed(1);
        }

        // Cargar la entrega propia de cada tarea
        this.tareas.forEach(tarea => this.cargarMiEntrega(tarea));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarMiEntrega(tarea: any) {
    this.tareaService.getMiEntrega(tarea.id).subscribe({
      next: (entrega) => {
        tarea.miEntrega = entrega;
        this.cdr.detectChanges();
      }
    });
  }

  onSeleccionEntrega(event: Event, tarea: any) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    const grande = files.find(f => f.size > this.MAX_BYTES);
    if (grande) {
      this.snackBar.open(`El archivo ${grande.name} supera el tamaño máximo de 10 MB`, 'OK', { duration: 4000 });
      input.value = '';
      return;
    }

    tarea.subiendo = true;
    this.tareaService.subirEntrega(tarea.id, files).subscribe({
      next: () => {
        tarea.subiendo = false;
        input.value = '';
        this.snackBar.open('Entrega subida', 'OK', { duration: 2500 });
        this.cargarMiEntrega(tarea);
      },
      error: (e) => {
        tarea.subiendo = false;
        input.value = '';
        this.snackBar.open(e?.error?.error || 'Error al subir la entrega', 'OK', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarArchivoEntrega(archivo: any, tarea: any) {
    if (!confirm(`¿Eliminar "${archivo.nombreOriginal}"?`)) return;
    this.tareaService.eliminarArchivoEntrega(archivo.id).subscribe({
      next: () => {
        if (tarea.miEntrega?.archivos) {
          tarea.miEntrega.archivos = tarea.miEntrega.archivos.filter((a: any) => a.id !== archivo.id);
        }
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Error al eliminar archivo', 'OK', { duration: 3000 })
    });
  }

  volver() {
    this.router.navigate(['/estudiante']);
  }
}