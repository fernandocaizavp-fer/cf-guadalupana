import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CursoService } from '../../../services/curso';

@Component({
  selector: 'app-nuevo-curso',
  imports: [FormsModule, MatToolbarModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatSnackBarModule],
  templateUrl: './nuevo-curso.html',
  styleUrl: './nuevo-curso.scss'
})
export class NuevoCurso {
  loading = false;

  datos = {
    ramaArtesanal: '',
    anioFormativo: '',
    fechaInicio: '',
    fechaFin: ''
  };

  constructor(private cursoService: CursoService, private router: Router, private snackBar: MatSnackBar) {}

  guardar() {
    if (!this.datos.ramaArtesanal || !this.datos.anioFormativo || !this.datos.fechaInicio || !this.datos.fechaFin) {
      this.snackBar.open('Todos los campos son obligatorios', 'OK', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.cursoService.crearCurso(this.datos).subscribe({
      next: () => {
        this.snackBar.open('Curso creado exitosamente', 'OK', { duration: 3000 });
        this.router.navigate(['/cursos']);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al crear curso', 'OK', { duration: 3000 });
      }
    });
  }

  volver() {
    this.router.navigate(['/cursos']);
  }
}