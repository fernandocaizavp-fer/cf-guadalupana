import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NotaService } from '../../../services/nota';
import { CursoService } from '../../../services/curso';

@Component({
  selector: 'app-notas-curso',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './notas-curso.html',
  styleUrl: './notas-curso.scss'
})
export class NotasCurso implements OnInit {
  curso: any = null;
  materias: any[] = [];
  matriculas: any[] = [];
  loading = true;
  guardando = false;
  lugarFecha = '';
  cursoId = 0;

  // Matriz de notas: notas[matriculaId][materiaId] = valor
  notas: { [key: string]: { [key: string]: number | string } } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notaService: NotaService,
    private cursoService: CursoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));

    this.cursoService.obtenerCurso(this.cursoId).subscribe({
      next: (curso) => {
        this.curso = curso;
        this.cdr.detectChanges();
      }
    });

    this.notaService.getNotasCurso(this.cursoId).subscribe({
      next: (data) => {
        // Si es PROFESOR, mostrar solo su materia asignada
        if (usuario.rol === 'PROFESOR') {
          this.materias = data.materias.filter((m: any) => m.profesorId === usuario.id);
        } else {
          this.materias = data.materias;
        }

        this.matriculas = data.matriculas;

        this.matriculas.forEach(m => {
          this.notas[m.id] = {};
          this.materias.forEach((mat: any) => {
            const nota = m.notas.find((n: any) => n.materiaId === mat.id);
            this.notas[m.id][mat.id] = nota ? nota.valor : '';
          });
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


  calcularPromedio(matriculaId: number): string {
    const notasMatricula = Object.values(this.notas[matriculaId] || {})
      .filter(v => v !== '' && v !== null);
    if (notasMatricula.length === 0) return '-';
    const suma = notasMatricula.reduce((a, b) => Number(a) + Number(b), 0);
    return (Number(suma) / notasMatricula.length).toFixed(2);
  }

  guardarNotas() {
    this.guardando = true;
    const notasArray: any[] = [];

    this.matriculas.forEach(m => {
      this.materias.forEach(mat => {
        const valor = this.notas[m.id]?.[mat.id];
        if (valor !== '' && valor !== null && valor !== undefined) {
          notasArray.push({
            matriculaId: m.id,
            materiaId: mat.id,
            valor: Number(valor)
          });
        }
      });
    });

    this.notaService.guardarNotasMasivo(notasArray).subscribe({
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

  descargarAL14() {
    if (!this.lugarFecha) {
      this.snackBar.open('Ingresa el lugar y fecha primero', 'OK', { duration: 3000 });
      return;
    }
    this.notaService.descargarAL14(this.cursoId, this.lugarFecha).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AL14_${this.curso?.ramaArtesanal || 'notas'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al descargar AL14', 'OK', { duration: 3000 })
    });
  }

  volver() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.rol === 'PROFESOR') {
      this.router.navigate(['/profesor']);
    } else {
      this.router.navigate(['/cursos', this.cursoId]);
    }
  }
}