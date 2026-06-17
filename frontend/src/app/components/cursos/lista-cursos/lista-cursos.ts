import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoService } from '../../../services/curso';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-lista-cursos',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './lista-cursos.html',
  styleUrl: './lista-cursos.scss'
})
export class ListaCursos implements OnInit {
  cursos: any[] = [];
  loading = true;

  constructor(
    private cursoService: CursoService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    if (confirm('¿Estás seguro de eliminar este curso?')) {
      this.cursoService.eliminarCurso(id).subscribe({
        next: () => {
          this.cursos = this.cursos.filter(c => c.id !== id);
          this.cdr.detectChanges();
        },
        error: () => alert('Error al eliminar el curso')
      });
    }
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}