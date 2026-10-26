import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Confirmacion } from '../../../shared/confirm-dialog/confirmacion';
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
import { LIMITES_MATRICULA, camposExcedidos } from '../../../services/matricula-limites';
import { validarIdentificacion, motivoCedulaInvalida } from '../../../services/cedula-util';
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
  private confirmacion = inject(Confirmacion);
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
    private titleService: Title,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Matrícula');
    this.matriculaService.getCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        const cursoId = this.route.snapshot.queryParams['cursoId'];
        if (cursoId) {
          this.datos.cursoId = Number(cursoId);
          this.onCursoChange();
        }
      },
      error: () => this.snackBar.open('Error al cargar cursos', 'OK', { duration: 3000 })
    });
  }

  // Al elegir un curso, autollenar Matrícula, Tomo y Página con el próximo
  // correlativo calculado por el backend (fuente única de verdad). El docente
  // solo verifica; no debe cambiar nada.
  onCursoChange() {
    if (!this.datos.cursoId) return;
    this.matriculaService.getSiguienteMatricula(this.datos.cursoId).subscribe({
      next: (p: any) => {
        this.datos.matriculaNo = p.matriculaNo;
        this.datos.tomo = p.tomo;
        this.datos.pagina = p.pagina;
        // App zoneless: forzar el refresco de la vista al llegar la respuesta.
        this.cdr.markForCheck();
      },
      error: () => this.snackBar.open('No se pudo calcular el número de matrícula', 'OK', { duration: 3000 })
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

  // Aviso bajo el campo de cédula. Mientras se escriben dígitos no se molesta:
  // solo se evalúa al completar los 10 o si el valor tiene letras (pasaporte).
  errorCedula(): string | null {
    const id = String(this.datos.cedula ?? '').trim();
    if (!id || (/^\d+$/.test(id) && id.length < 10)) return null;
    return validarIdentificacion(id);
  }

  confirmacionCedula(): string | null {
    const id = String(this.datos.cedula ?? '').trim();
    if (!id || this.errorCedula()) return null;
    if (/^\d{10}$/.test(id)) return 'Cédula válida';
    return /^\d+$/.test(id) ? null : 'Pasaporte';
  }

  // ── Límites de longitud (ver services/matricula-limites.ts) ──
  lim = LIMITES_MATRICULA;

  max(campo: string): number {
    return this.lim[campo].max;
  }

  largo(campo: string): number {
    return String(this.datos?.[campo] ?? '').length;
  }

  // El contador aparece desde el 80 % del máximo, para no recargar el formulario.
  cercaDelLimite(campo: string): boolean {
    return this.largo(campo) >= this.max(campo) * 0.8;
  }

  excede(campo: string): boolean {
    return this.largo(campo) > this.max(campo);
  }

  guardar() {
    if (!this.datos.cursoId) {
      this.snackBar.open('Selecciona un curso', 'OK', { duration: 3000 });
      return;
    }
    const errorCedula = validarIdentificacion(this.datos.cedula);
    if (errorCedula) {
      this.snackBar.open(errorCedula, 'OK', { duration: 5000, panelClass: ['app-snackbar', 'app-snackbar-error'] });
      return;
    }
    const excedidos = camposExcedidos(this.datos);
    if (excedidos.length) {
      this.snackBar.open(
        `Hay campos demasiado largos: ${excedidos.join(', ')}`,
        'OK',
        { duration: 7000, panelClass: ['app-snackbar', 'app-snackbar-error'] }
      );
      return;
    }
    this.enviarMatricula(false);
  }

  // Si la cédula pertenece a un estudiante eliminado (matrícula archivada), el
  // backend responde 409 con `reactivable`: se pide confirmación y se reintenta
  // con reactivar=true, que restaura su registro y su cuenta en este curso.
  private enviarMatricula(reactivar: boolean) {
    this.loading = true;
    this.matriculaService.crearMatricula({ ...this.datos, reactivar }).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.snackBar.open(
          resp?.reactivado
            ? 'Estudiante reactivado. Su contraseña vuelve a ser su cédula.'
            : 'Matrícula guardada exitosamente',
          'OK',
          { duration: 4000 }
        );
        // Vuelve al detalle del curso, donde ya aparece el nuevo estudiante.
        // La matrícula se puede descargar después desde ahí.
        this.router.navigate(['/cursos', this.datos.cursoId]);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        if (err.status === 409 && err.error?.reactivable && !reactivar) {
          this.confirmacion.preguntar({
            titulo: 'Estudiante eliminado anteriormente',
            mensaje: err.error.error,
            confirmText: 'Reactivar y matricular',
            cancelText: 'Cancelar',
            icon: 'restore'
          }).subscribe(ok => {
            if (ok) this.enviarMatricula(true);
          });
          return;
        }
        this.snackBar.open(err.error?.error || 'Error al crear matrícula', 'OK',
          { duration: 5000, panelClass: ['app-snackbar', 'app-snackbar-error'] });
      }
    });
  }

  // Cada consulta cuesta $0.05, así que una acción del usuario debe producir
  // exactamente una petición: se bloquea mientras hay una en curso y se ignora
  // la misma cédula ya consultada. La consulta se dispara solo desde el botón
  // "Consultar" o con Enter; nunca de forma automática al escribir.
  buscarPorCedula() {
    if (this.consultandoCedula) return;
    // Validar antes de consultar: la API cobra aunque la cédula no exista.
    const motivo = motivoCedulaInvalida(String(this.datos.cedula ?? '').trim());
    if (motivo) {
      this.snackBar.open(`Cédula inválida: ${motivo}`, 'OK', { duration: 5000, panelClass: ['app-snackbar', 'app-snackbar-error'] });
      return;
    }
    if (this.datos.cedula === this.ultimaCedulaConsultada) {
      // Sin este aviso el clic parecería no hacer nada.
      this.snackBar.open('Esta cédula ya fue consultada', 'OK', { duration: 3000 });
      return;
    }

    this.ultimaCedulaConsultada = this.datos.cedula;
    this.consultandoCedula = true;
    // Se limpia ANTES de consultar: si la segunda persona no tiene un dato, no
    // debe quedar visible el de la primera.
    this.limpiarDatosConsultaCedula();

    this.matriculaService.consultarCedula(this.datos.cedula).subscribe({
      next: (d: any) => {
        const { nivelEstudio, tipoBachiller } = this.mapearInstruccion(d.instruccion);
        // Se asignan TODOS los campos, con '' cuando la respuesta no los trae.
        // Usar `d.x || this.datos.x` dejaría residuos de la cédula anterior.
        this.datos.cedula = d.cedula ?? this.datos.cedula;
        this.datos.apellidos = d.apellidos ?? '';
        this.datos.nombres = d.nombres ?? '';
        this.datos.sexo = d.sexo ?? '';
        this.datos.fechaNacimiento = d.fechaNacimiento ?? '';
        this.datos.pais = d.pais ?? 'ECUADOR';
        this.datos.nacionalidad = d.nacionalidad ?? '';
        this.datos.provincia = d.provincia ?? '';
        this.datos.canton = d.canton ?? '';
        this.datos.parroquia = d.parroquia ?? '';
        this.datos.ciudad = d.ciudad ?? '';
        this.datos.calle = d.calle ?? '';
        this.datos.num = d.num ?? '';
        this.datos.transversal = d.transversal ?? '';
        this.datos.telefono = d.telefono ?? '';
        this.datos.correoestudiante = d.correo ?? '';
        this.datos.nivelEstudio = nivelEstudio;
        this.datos.tipoBachiller = tipoBachiller;
        this.datos.nombrepapa = d.nombrepapa ?? '';
        this.datos.nombremama = d.nombremama ?? '';
        this.consultandoCedula = false;
        this.cdr.markForCheck();
        this.snackBar.open('Datos cargados desde el Registro Civil', 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        this.consultandoCedula = false;
        this.ultimaCedulaConsultada = '';
        // Si la consulta falla, tampoco deben quedar datos viejos a la vista.
        this.limpiarDatosConsultaCedula();
        this.cdr.markForCheck();
        this.snackBar.open(err.error?.error || 'No se pudieron cargar los datos', 'OK', { duration: 3000 });
      }
    });
  }

  // Al editar la cédula tras una consulta previa, los datos mostrados dejan de
  // corresponder a esa persona: se borran para no mezclar dos identidades.
  onCedulaChange(): void {
    if (!this.ultimaCedulaConsultada) return;
    if (this.datos.cedula === this.ultimaCedulaConsultada) return;
    this.ultimaCedulaConsultada = '';
    this.limpiarDatosConsultaCedula();
    this.cdr.markForCheck();
  }

  // Limpia SOLO los campos que llena la consulta de cédula. No toca matrícula,
  // tomo, página, curso ni ningún otro dato administrativo, porque esos no
  // pertenecen a la persona consultada.
  private limpiarDatosConsultaCedula(): void {
    this.datos.apellidos = '';
    this.datos.nombres = '';
    this.datos.sexo = '';
    this.datos.fechaNacimiento = '';
    this.datos.pais = 'ECUADOR';
    this.datos.nacionalidad = '';
    this.datos.provincia = '';
    this.datos.canton = '';
    this.datos.parroquia = '';
    this.datos.ciudad = '';
    this.datos.calle = '';
    this.datos.num = '';
    this.datos.transversal = '';
    this.datos.telefono = '';
    this.datos.correoestudiante = '';
    this.datos.nivelEstudio = '';
    this.datos.tipoBachiller = '';
    this.datos.nombrepapa = '';
    this.datos.nombremama = '';
  }

  // Traduce el texto libre de instrucción del Registro Civil a los valores
  // reales del desplegable ('a1' | 'a2' | 'a4') y del tipo de título
  // ('Bachiller' | 'Superior' | 'Otro'). Si el valor no es identificable con
  // certeza no se selecciona nada: es preferible un campo vacío que un dato
  // inventado en un documento oficial.
  private mapearInstruccion(instruccion: string): { nivelEstudio: string; tipoBachiller: string } {
    const v = (instruccion || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, ''); // tolera tildes: "BÁSICA" → "BASICA"

    if (!v) return { nivelEstudio: '', tipoBachiller: '' };

    if (v.includes('PRIMARIA')) return { nivelEstudio: 'a1', tipoBachiller: '' };
    if (v.includes('CICLO BASICO') || v.includes('EDUCACION BASICA') || v.includes('BASICA')) {
      return { nivelEstudio: 'a2', tipoBachiller: '' };
    }
    if (v.includes('BACHILLER') || v.includes('SECUNDARIA COMPLETA')) {
      return { nivelEstudio: 'a4', tipoBachiller: 'Bachiller' };
    }
    if (v.includes('SUPERIOR') || v.includes('UNIVERSITARI') || v.includes('TERCER NIVEL')) {
      return { nivelEstudio: 'a4', tipoBachiller: 'Superior' };
    }
    if (v.includes('OTRO')) return { nivelEstudio: 'a4', tipoBachiller: 'Otro' };

    return { nivelEstudio: '', tipoBachiller: '' };
  }

  // Copia nombre y ocupación del padre o de la madre al representante.
  // El domicilio del representante no se toca (puede ser distinto).
  usarRepresentante(quien: 'padre' | 'madre'): void {
    if (quien === 'padre') {
      this.datos.nombrerepresentante = this.datos.nombrepapa || this.datos.nombrerepresentante;
      this.datos.ocupacionrepresentante = this.datos.ocupacionpapa || this.datos.ocupacionrepresentante;
    } else {
      this.datos.nombrerepresentante = this.datos.nombremama || this.datos.nombrerepresentante;
      this.datos.ocupacionrepresentante = this.datos.ocupacionmama || this.datos.ocupacionrepresentante;
    }
    this.cdr.markForCheck();
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