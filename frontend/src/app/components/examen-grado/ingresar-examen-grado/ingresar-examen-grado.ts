import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ExamenGradoService } from '../../../services/examen-grado';
import { ConfiguracionService } from '../../../services/configuracion';

@Component({
  selector: 'app-ingresar-examen-grado',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './ingresar-examen-grado.html',
  styleUrl: './ingresar-examen-grado.scss'
})
export class IngresarExamenGrado implements OnInit {
  materia: any = null;
  estudiantes: any[] = [];
  notas: { [key: number]: number | null } = {};
  loading = true;
  guardando = false;
  materiaId!: number;
  notaMin = 0;
  notaMax = 10;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examenGradoService: ExamenGradoService,
    private configService: ConfiguracionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.materiaId = Number(this.route.snapshot.paramMap.get('materiaId'));
    this.configService.obtener().subscribe({
      next: (c) => { this.notaMin = c.notaMinima; this.notaMax = c.notaMaxima; }
    });
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    this.loading = true;
    this.examenGradoService.getEstudiantes(this.materiaId).subscribe({
      next: (data) => {
        this.materia = data.materia;
        this.estudiantes = data.estudiantes;
        this.estudiantes.forEach(e => {
          this.notas[e.id] = e.valor ?? null;
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

  guardar() {
    this.guardando = true;
    const notas = this.estudiantes.map(e => ({
      matriculaId: e.id,
      materiaId: this.materiaId,
      valor: this.notas[e.id] !== null ? this.notas[e.id] : null
    }));

    this.examenGradoService.guardar(notas).subscribe({
      next: () => {
        this.snackBar.open('Exámenes guardados correctamente', 'OK', { duration: 3000 });
        this.guardando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'Error al guardar', 'OK', { duration: 4000 });
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get estudiantesConNota(): number {
    return this.estudiantes.filter(e => this.notas[e.id] !== null && this.notas[e.id] !== undefined).length;
  }

  volver() {
    this.router.navigate(['/profesor']);
  }

  
}