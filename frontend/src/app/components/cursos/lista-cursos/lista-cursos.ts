import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Confirmacion } from '../../../shared/confirm-dialog/confirmacion';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursoService } from '../../../services/curso';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-lista-cursos',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './lista-cursos.html',
  styleUrl: './lista-cursos.scss'
})
export class ListaCursos implements OnInit {
  private confirmacion = inject(Confirmacion);
  cursos: any[] = [];
  loading = true;

  constructor(
    private cursoService: CursoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cursoService.listarCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irADetalle(id: number) {
    this.router.navigate(['/cursos', id]);
  }

  irANuevoCurso() {
    this.router.navigate(['/cursos/nuevo']);
  }

  editar(event: Event, id: number) {
    event.stopPropagation();
    this.router.navigate(['/cursos/editar', id]);
  }

  eliminar(event: Event, id: number) {
    event.stopPropagation();
    const curso = this.cursos.find(c => c.id === id);
    const nombre = curso?.ramaArtesanal ? `"${curso.ramaArtesanal}"` : 'este curso';
    this.confirmacion.eliminar('Eliminar curso', `¿Deseas eliminar ${nombre}? Esta acción no se puede deshacer.`).subscribe(ok => {
      if (ok) this.borrar(id, false);
    });
  }

  // El backend responde 409 con requiereConfirmacion cuando el curso solo tiene
  // matrículas archivadas: se pide una segunda confirmación y se reintenta con
  // forzar=true. Cualquier otro error muestra el mensaje real del backend.
  private borrar(id: number, forzar: boolean) {
    this.cursoService.eliminarCurso(id, forzar).subscribe({
      next: () => {
        this.cursos = this.cursos.filter(c => c.id !== id);
        this.snackBar.open('Curso eliminado correctamente', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        const cuerpo = err?.error;
        if (cuerpo?.requiereConfirmacion && !forzar) {
          this.confirmacion.eliminar(
            'El curso tiene matrículas archivadas',
            `${cuerpo.error}\n\n¿Eliminar el curso de todos modos?`,
            'Eliminar de todos modos'
          ).subscribe(ok => {
            if (ok) this.borrar(id, true);
          });
          return;
        }
        this.snackBar.open(cuerpo?.error || 'No se pudo eliminar el curso', 'OK', { duration: 4000, panelClass: ['app-snackbar', 'app-snackbar-error'] });
      }
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}