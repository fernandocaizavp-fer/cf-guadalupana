import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CursoService } from '../../../services/curso';
import { TareaService } from '../../../services/tarea';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-notas-tarea',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatInputModule, MatFormFieldModule],
  templateUrl: './notas-tarea.html',
  styleUrl: './notas-tarea.scss'
})
export class NotasTarea implements OnInit {
  materiaId = 0;
  tareaId = 0;
  tarea: any = null;
  matriculas: any[] = [];
  loading = true;
  guardando = false;

  // notas[matriculaId] = { valor, observacion }
  notas: { [key: number]: { valor: string, observacion: string } } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private cursoService: CursoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Calificaciones');
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.tareaId = Number(this.route.snapshot.paramMap.get('tareaId'));
    this.cargarDatos();
  }

  cargarDatos() {
    this.tareaService.getTareasPorMateria(this.materiaId).subscribe({
      next: (tareas) => {
        this.tarea = tareas.find((t: any) => t.id === this.tareaId);
        if (this.tarea) {
          // Cargar estudiantes del curso de la materia
          const cursoId = this.tarea.materia?.cursoId;
          if (cursoId) {
            this.cursoService.obtenerCurso(cursoId).subscribe({
              next: (curso) => {
                this.matriculas = curso.matriculas || [];
                // Inicializar notas
                this.matriculas.forEach((m: any) => {
                  const notaExistente = this.tarea.notas?.find((n: any) => n.matriculaId === m.id);
                  this.notas[m.id] = {
                    valor: notaExistente?.valor !== null && notaExistente?.valor !== undefined
                      ? String(notaExistente.valor) : '',
                    observacion: notaExistente?.observacion || ''
                  };
                });
                this.loading = false;
                this.cdr.detectChanges();
              }
            });
          }
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarNotas() {
    this.guardando = true;
    const notasArray = this.matriculas.map(m => ({
      tareaId: this.tareaId,
      matriculaId: m.id,
      valor: this.notas[m.id]?.valor !== '' ? this.notas[m.id]?.valor : null,
      observacion: this.notas[m.id]?.observacion || null
    }));

    this.tareaService.guardarNotas(notasArray).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Notas guardadas exitosamente', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar notas', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  volver() {
    this.router.navigate(['/tareas', this.materiaId]);
  }
}