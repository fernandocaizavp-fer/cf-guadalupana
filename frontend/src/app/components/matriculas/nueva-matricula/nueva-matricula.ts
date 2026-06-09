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
import { Title } from '@angular/platform-browser';

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
  consultandoCedula = false;
  ultimaCedulaConsultada = '';
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
    private snackBar: MatSnackBar,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Matrícula');
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
    return this.datos.sexo === 'Masculino' ? 'El' : 
          this.datos.sexo === 'Femenino' ? 'La' : '';
  }

  get tratamiento(): string {
    return this.datos.sexo === 'Masculino' ? 'Sr.' : 
          this.datos.sexo === 'Femenino' ? 'Srta.' : '';
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

  buscarPorCedula() {
    if (!this.datos.cedula || this.datos.cedula.length !== 10) return;
    // Evita consultar la misma cédula varias veces o mientras ya está consultando
    if (this.datos.cedula === this.ultimaCedulaConsultada) return;
    if (this.consultandoCedula) return;

    this.ultimaCedulaConsultada = this.datos.cedula;
    this.consultandoCedula = true;
    this.matriculaService.consultarCedula(this.datos.cedula).subscribe({
      next: (d: any) => {
        this.datos.apellidos = d.apellidos || this.datos.apellidos;
        this.datos.nombres = d.nombres || this.datos.nombres;
        this.datos.sexo = d.sexo || this.datos.sexo;
        this.datos.fechaNacimiento = d.fechaNacimiento || this.datos.fechaNacimiento;
        this.datos.nacionalidad = d.nacionalidad || this.datos.nacionalidad;
        this.datos.pais = d.pais || this.datos.pais;
        this.datos.provincia = d.provincia || this.datos.provincia;
        this.datos.canton = d.canton || this.datos.canton;
        this.datos.parroquia = d.parroquia || this.datos.parroquia;
        this.datos.calle = d.calle || this.datos.calle;
        this.datos.num = d.num || this.datos.num;
        this.datos.telefono = d.telefono || this.datos.telefono;
        this.datos.correoestudiante = d.correo || this.datos.correoestudiante;
        this.datos.nivelEstudio = d.nivelEstudio || this.datos.nivelEstudio;
        this.datos.nombrepapa = d.nombrepapa || this.datos.nombrepapa;
        this.datos.nombremama = d.nombremama || this.datos.nombremama;
        this.consultandoCedula = false;
        this.snackBar.open('Datos cargados desde el Registro Civil', 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        this.consultandoCedula = false;
        this.ultimaCedulaConsultada = '';
        this.snackBar.open(err.error?.error || 'No se pudieron cargar los datos', 'OK', { duration: 3000 });
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