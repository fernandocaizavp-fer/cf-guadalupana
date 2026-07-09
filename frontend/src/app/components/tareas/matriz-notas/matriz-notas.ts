import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TareaService } from '../../../services/tarea';
import { CursoService } from '../../../services/curso';
import { ConfiguracionService } from '../../../services/configuracion';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-matriz-notas',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './matriz-notas.html',
  styleUrl: './matriz-notas.scss'
})
export class MatrizNotas implements OnInit {
  materiaId = 0;
  materia: any = null;
  tareas: any[] = [];
  matriculas: any[] = [];
  loading = true;
  guardando = false;
  semestreSeleccionado = 1;
  notaMin = 0;
  notaMax = 10;

  // valores[matriculaId_tareaId] = nota como texto ('' = sin nota).
  // originales guarda el último valor confirmado, para detectar cambios pendientes.
  valores: { [key: string]: string } = {};
  originales: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private cursoService: CursoService,
    private configService: ConfiguracionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Matriz de notas');
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.configService.obtener().subscribe({
      next: (c) => { this.notaMin = c.notaMinima; this.notaMax = c.notaMaxima; }
    });
    this.cargarDatos();
  }

  clave(matriculaId: number, tareaId: number): string {
    return `${matriculaId}_${tareaId}`;
  }

  // Guarda el texto crudo del input (evita que <input type=number> + ngModel
  // convierta a number/null y rompa la comparación de cambios y el vaciado).
  onCelda(matriculaId: number, tareaId: number, event: Event) {
    this.valores[this.clave(matriculaId, tareaId)] = (event.target as HTMLInputElement).value;
  }

  cargarDatos() {
    this.loading = true;
    this.tareaService.getTareasPorMateria(this.materiaId, this.semestreSeleccionado).subscribe({
      next: (tareas) => {
        this.tareas = tareas;
        if (tareas.length > 0) this.materia = tareas[0].materia;

        // Sin tareas no hay columnas; igual mostramos la lista de estudiantes si podemos.
        const cursoId = tareas[0]?.materia?.cursoId ?? this.materia?.cursoId;
        if (!cursoId) { this.loading = false; this.cdr.detectChanges(); return; }

        this.cursoService.obtenerCurso(cursoId).subscribe({
          next: (curso) => {
            this.materia = this.materia || (curso.materias || []).find((m: any) => m.id === this.materiaId);
            this.matriculas = [...(curso.matriculas || [])].sort(
              (a, b) => (a.matriculaNo || '').localeCompare(b.matriculaNo || '')
            );
            this.valores = {};
            this.originales = {};
            for (const t of this.tareas) {
              for (const m of this.matriculas) {
                const nota = t.notas?.find((n: any) => n.matriculaId === m.id);
                const v = nota?.valor !== null && nota?.valor !== undefined ? String(nota.valor) : '';
                this.valores[this.clave(m.id, t.id)] = v;
                this.originales[this.clave(m.id, t.id)] = v;
              }
            }
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar la matriz', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  cambiarSemestre(semestre: number) {
    if (this.hayCambiosPendientes() &&
        !confirm('Hay notas sin guardar. ¿Cambiar de semestre y descartarlas?')) return;
    this.semestreSeleccionado = semestre;
    this.cargarDatos();
  }

  // Una celda está pendiente si su valor difiere del último confirmado.
  celdaPendiente(matriculaId: number, tareaId: number): boolean {
    const k = this.clave(matriculaId, tareaId);
    return this.valores[k] !== this.originales[k];
  }

  hayCambiosPendientes(): boolean {
    return Object.keys(this.valores).some((k) => this.valores[k] !== this.originales[k]);
  }

  totalPendientes(): number {
    return Object.keys(this.valores).filter((k) => this.valores[k] !== this.originales[k]).length;
  }

  // Al salir de una celda, si cambió, se guarda solo esa nota.
  guardarCelda(matriculaId: number, tareaId: number) {
    if (!this.celdaPendiente(matriculaId, tareaId)) return;
    const k = this.clave(matriculaId, tareaId);
    const valor = this.valores[k];
    this.tareaService.guardarNotas([{
      tareaId, matriculaId,
      valor: valor !== '' ? valor : null,
      observacion: null
    }]).subscribe({
      next: () => {
        this.originales[k] = valor;
        this.cdr.detectChanges();
      },
      error: (e) => {
        // Revierte la celda al último valor válido y avisa.
        this.valores[k] = this.originales[k];
        this.snackBar.open(e?.error?.error || 'Error al guardar la nota', 'OK', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }

  guardarTodo() {
    const pendientes = Object.keys(this.valores).filter((k) => this.valores[k] !== this.originales[k]);
    if (pendientes.length === 0) {
      this.snackBar.open('No hay cambios por guardar', 'OK', { duration: 2500 });
      return;
    }
    this.guardando = true;
    const notas = pendientes.map((k) => {
      const [matriculaId, tareaId] = k.split('_').map(Number);
      const valor = this.valores[k];
      return { tareaId, matriculaId, valor: valor !== '' ? valor : null, observacion: null };
    });
    this.tareaService.guardarNotas(notas).subscribe({
      next: () => {
        pendientes.forEach((k) => (this.originales[k] = this.valores[k]));
        this.guardando = false;
        this.snackBar.open(`Se guardaron ${notas.length} nota(s)`, 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.guardando = false;
        this.snackBar.open(e?.error?.error || 'Error al guardar las notas', 'OK', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }

  // Promedio de las notas ya registradas del estudiante (referencia visual, no es la nota final oficial).
  promedioEstudiante(matriculaId: number): string {
    const nums = this.tareas
      .map((t) => this.valores[this.clave(matriculaId, t.id)])
      .filter((v) => v !== '' && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) return '—';
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
  }

  // Cuántas notas le faltan al estudiante (celdas vacías).
  faltantesEstudiante(matriculaId: number): number {
    return this.tareas.filter((t) => (this.valores[this.clave(matriculaId, t.id)] || '') === '').length;
  }

  volver() {
    this.router.navigate(['/tareas', this.materiaId]);
  }
}
