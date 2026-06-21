import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { AnuncioService } from '../../../services/anuncio';
import { etiquetaAutorAnuncio } from '../../../services/anuncio-util';

@Component({
  selector: 'app-gestionar-anuncios',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatFormFieldModule,
    MatInputModule, MatCardModule, DatePipe],
  templateUrl: './gestionar-anuncios.html',
  styleUrl: './gestionar-anuncios.scss'
})
export class GestionarAnuncios implements OnInit {
  anuncios: any[] = [];
  loading = true;
  guardando = false;
  etiquetaAutor = etiquetaAutorAnuncio;
  imagenPreview: string | null = null;
  imagenFile: File | null = null;
  editando: any = null;

  nuevo = {
    titulo: '',
    contenido: '',
    activo: true
  };

  constructor(
    private router: Router,
    private anuncioService: AnuncioService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAnuncios();
  }

  cargarAnuncios() {
    this.loading = true;
    this.anuncioService.listarTodos().subscribe({
      next: (anuncios) => {
        this.anuncios = anuncios;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  guardar() {
  if (!this.nuevo.titulo || !this.nuevo.contenido) {
    this.snackBar.open('Título y contenido son obligatorios', 'OK', { duration: 3000 });
    this.cdr.detectChanges();
    return;
  }
  this.guardando = true;
  this.cdr.detectChanges();
  
  const formData = new FormData();
  formData.append('titulo', this.nuevo.titulo);
  formData.append('contenido', this.nuevo.contenido);
  formData.append('activo', String(this.nuevo.activo));
  if (this.imagenFile) formData.append('imagen', this.imagenFile);

  const request = this.editando
    ? this.anuncioService.actualizarAnuncio(this.editando.id, formData)
    : this.anuncioService.crearAnuncio(formData);

  request.subscribe({
    next: () => {
      this.guardando = false;
      this.snackBar.open(this.editando ? 'Anuncio actualizado' : 'Anuncio creado', 'OK', { duration: 3000 });
      this.resetForm();
      this.cargarAnuncios();
    },
    error: (err) => {
      this.guardando = false;
      console.error('Error:', err);
      this.snackBar.open('Error al guardar anuncio', 'OK', { duration: 3000 });
      this.cdr.detectChanges();
    }
  });
}

  editar(anuncio: any) {
    this.editando = anuncio;
    this.nuevo = {
      titulo: anuncio.titulo,
      contenido: anuncio.contenido,
      activo: anuncio.activo
    };
    this.imagenPreview = anuncio.imagen ? `https://cf-guadalupana-production.up.railway.app${anuncio.imagen}` : null;
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar este anuncio?')) {
      this.anuncioService.eliminarAnuncio(id).subscribe({
        next: () => {
          this.snackBar.open('Anuncio eliminado', 'OK', { duration: 3000 });
          this.cargarAnuncios();
        },
        error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    }
  }

  resetForm() {
    this.nuevo = { titulo: '', contenido: '', activo: true };
    this.imagenPreview = null;
    this.imagenFile = null;
    this.editando = null;
    this.cdr.detectChanges();
  }

  getImagenUrl(imagen: string): string {
    if (!imagen) return '';
    // Cloudinary devuelve URL completa (http...); los anuncios viejos guardan
    // una ruta relativa servida por el backend.
    return imagen.startsWith('http')
      ? imagen
      : `https://cf-guadalupana-production.up.railway.app${imagen}`;
  }

  volver() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.router.navigate([usuario.rol === 'PROFESOR' ? '/profesor' : '/dashboard']);
  }
}