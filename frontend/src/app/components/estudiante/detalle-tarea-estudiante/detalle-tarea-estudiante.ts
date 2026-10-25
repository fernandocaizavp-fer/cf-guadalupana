import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { descargarConNombre } from '../../../shared/descargar-archivo';
import { Confirmacion } from '../../../shared/confirm-dialog/confirmacion';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../services/auth';
import { TareaService } from '../../../services/tarea';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-detalle-tarea-estudiante',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  templateUrl: './detalle-tarea-estudiante.html',
  styleUrl: './detalle-tarea-estudiante.scss'
})
export class DetalleTareaEstudiante implements OnInit {
  private confirmacion = inject(Confirmacion);
  materiaId = 0;
  tareaId = 0;
  semestre = 1;
  matriculaId = 0;

  tarea: any = null;
  miNota: number | null = null;
  miEntrega: any = null;
  loading = true;
  subiendo = false;

  private readonly MAX_BYTES = 10 * 1024 * 1024;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tareaService: TareaService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.tareaId = Number(this.route.snapshot.paramMap.get('tareaId'));
    this.semestre = Number(this.route.snapshot.paramMap.get('semestre'));

    const usuario = this.authService.getUsuario();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.authService.getToken()}` });

    this.http.get<any>(
      `https://cf-guadalupana-production.up.railway.app/api/usuarios/perfil-estudiante/${usuario.id}`,
      { headers }
    ).subscribe({
      next: (matricula) => {
        this.matriculaId = matricula.id;
        this.cargar();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  cargar() {
    this.tareaService.getTareasPorMateria(this.materiaId).subscribe({
      next: (tareas) => {
        this.tarea = tareas.find((t: any) => t.id === this.tareaId) || null;
        const nota = this.tarea?.notas?.find((n: any) => n.matriculaId === this.matriculaId);
        this.miNota = nota?.valor ?? null;
        this.cargarMiEntrega();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private cargarMiEntrega() {
    this.tareaService.getMiEntrega(this.tareaId).subscribe({
      next: (entrega) => { this.miEntrega = entrega; this.cdr.detectChanges(); }
    });
  }

  // El plazo vence si la tarea tiene fecha límite y ya pasó.
  get plazoVencido(): boolean {
    if (!this.tarea?.fechaFin) return false;
    return new Date() > new Date(this.tarea.fechaFin);
  }

  onSeleccionEntrega(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    if (this.plazoVencido) {
      this.snackBar.open('El plazo de entrega ya finalizó', 'OK', { duration: 3500 });
      input.value = '';
      return;
    }

    const grande = files.find(f => f.size > this.MAX_BYTES);
    if (grande) {
      this.snackBar.open(`El archivo ${grande.name} supera el tamaño máximo de 10 MB`, 'OK', { duration: 4000 });
      input.value = '';
      return;
    }

    this.subiendo = true;
    this.tareaService.subirEntrega(this.tareaId, files).subscribe({
      next: () => {
        this.subiendo = false;
        input.value = '';
        this.snackBar.open('Entrega subida', 'OK', { duration: 2500 });
        this.cargarMiEntrega();
      },
      error: (e) => {
        this.subiendo = false;
        input.value = '';
        this.snackBar.open(e?.error?.error || 'Error al subir la entrega', 'OK', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  eliminarArchivoEntrega(archivo: any) {
    this.confirmacion.eliminar('Eliminar archivo', `¿Deseas eliminar "${archivo.nombreOriginal}" de tu entrega?`).subscribe(ok => {
      if (!ok) return;
      this.tareaService.eliminarArchivoEntrega(archivo.id).subscribe({
        next: () => {
          if (this.miEntrega?.archivos) {
            this.miEntrega.archivos = this.miEntrega.archivos.filter((a: any) => a.id !== archivo.id);
          }
          this.snackBar.open('Archivo eliminado correctamente', 'OK', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: (e) => this.snackBar.open(e?.error?.error || 'No se pudo eliminar el archivo', 'OK', { duration: 4000, panelClass: ['app-snackbar', 'app-snackbar-error'] })
      });
    });
  }

  // Descarga con el nombre original (tildes incluidas) en vez del que pone Cloudinary.
  descargar(event: Event, archivo: any) {
    event.preventDefault();
    descargarConNombre(archivo.url, archivo.nombreOriginal);
  }

  volver() {
    this.router.navigate(['/estudiante/materia', this.materiaId, this.semestre]);
  }
}
