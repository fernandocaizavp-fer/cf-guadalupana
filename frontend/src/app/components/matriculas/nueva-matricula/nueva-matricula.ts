import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatriculaService } from '../../../services/matricula';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-nueva-matricula',
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatCardModule, MatSelectModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatToolbarModule
  ],
  templateUrl: './nueva-matricula.html',
  styleUrl: './nueva-matricula.scss'
})
export class NuevaMatricula implements OnInit {
  loading = false;
  cursos: any[] = [];

  datos: any = {
    matriculaNo: '', tomo: '', pagina: '', cursoId: '',
    apellidos: '', nombres: '', cedula: '',
    sexo: '',
    fechaNacimiento: '', pais: 'ECUADOR', provincia: '', canton: '',
    parroquia: '', ciudad: '', nacionalidad: 'ECUATORIANA',
    calle: '', num: '', transversal: '', telefono: '',
    correo: '', correoestudiante: '',
    nivelEstudio: '',
    tipoBachiller: '',
    cursoanterior: '', unidadeducativa: '', centroformacionanterior: '',
    conferidoPorA1: '', conferidoPorA2: '',
    nombrepapa: '', profesionpapa: '', ocupacionpapa: '',
    nombremama: '', profesionmama: '', ocupacionmama: '',
    nombrerepresentante: '', ocupacionrepresentante: '',
    domiciliorepresentante: '', telefonorepresentante: '',
    lugarfechamatricula: '', especialidad: '', lugarfechacertificado: ''
  };

  constructor(
    private matriculaService: MatriculaService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.matriculaService.getCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        const cursoId = this.route.snapshot.queryParams['cursoId'];
        if (cursoId) this.datos.cursoId = Number(cursoId);
      },
      error: () => this.snackBar.open('Error al cargar cursos', 'OK', { duration: 3000 })
    });
  }

  get prefijo(): string {
    return this.datos.sexo === 'Masculino' ? 'El' : 'La';
  }

  get tratamiento(): string {
    return this.datos.sexo === 'Masculino' ? 'Sr.' : 'Srta.';
  }

  guardarYDescargar() {
    if (!this.datos.cursoId) {
      this.snackBar.open('Selecciona un curso', 'OK', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.matriculaService.crearMatricula(this.datos).subscribe({
      next: (res) => {
        const id = res.matricula.id;
        this.snackBar.open('Matrícula creada exitosamente', 'OK', { duration: 3000 });
        this.descargarDocumentos(id);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.error || 'Error al crear matrícula', 'OK', { duration: 4000 });
      }
    });
  }

  descargarDocumentos(id: number) {
    this.matriculaService.descargarMatricula(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matricula_${this.datos.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al descargar documento', 'OK', { duration: 3000 });
      }
    });
  }

  descargarCertificado(id: number) {
    this.matriculaService.descargarCertificado(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_${this.datos.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Error al descargar certificado', 'OK', { duration: 3000 });
      }
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}