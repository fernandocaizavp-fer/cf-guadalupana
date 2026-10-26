import { Component, OnInit, ChangeDetectorRef, Inject, inject } from '@angular/core';
import { Confirmacion } from '../../../shared/confirm-dialog/confirmacion';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { DatePipe } from '@angular/common';
import { CursoService } from '../../../services/curso';
import { MatriculaService } from '../../../services/matricula';
import { LIMITES_MATRICULA, camposExcedidos } from '../../../services/matricula-limites';
import { validarIdentificacion } from '../../../services/cedula-util';

@Component({
  selector: 'app-editar-matricula-dialog',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDialogModule, MatDividerModule, MatIconModule, MatSelectModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon>person_edit</mat-icon>
          <h2>Editar Información del Estudiante</h2>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="custom-content">
        <div class="form-grid">

          <div class="section-header">
            <mat-icon>account_circle</mat-icon>
            <span>Datos Personales</span>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Apellidos</mat-label>
              <input matInput [maxlength]="max('apellidos')" [(ngModel)]="datos.apellidos">
              @if (cercaDelLimite('apellidos')) {
                <mat-hint align="end" [class.hint-excede]="excede('apellidos')">{{ largo('apellidos') }}/{{ max('apellidos') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nombres</mat-label>
              <input matInput [maxlength]="max('nombres')" [(ngModel)]="datos.nombres">
              @if (cercaDelLimite('nombres')) {
                <mat-hint align="end" [class.hint-excede]="excede('nombres')">{{ largo('nombres') }}/{{ max('nombres') }}</mat-hint>
              }
            </mat-form-field>
          </div>
          <div class="row row-3">
            <mat-form-field appearance="outline">
              <mat-label>Cédula / Pasaporte</mat-label>
              <input matInput [(ngModel)]="datos.cedula" maxlength="10">
              @if (errorCedula(); as error) {
                <mat-hint class="hint-excede">{{ error }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sexo</mat-label>
              <mat-select [(ngModel)]="datos.sexo">
                <mat-option value="Masculino">Masculino</mat-option>
                <mat-option value="Femenino">Femenino</mat-option>
                <mat-option value="Otro">Otro</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha de Nacimiento</mat-label>
              <input matInput type="date" [(ngModel)]="datos.fechaNacimiento">
            </mat-form-field>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Correo Electrónico</mat-label>
              <input matInput [maxlength]="max('correoestudiante')" [(ngModel)]="datos.correoestudiante">
              @if (cercaDelLimite('correoestudiante')) {
                <mat-hint align="end" [class.hint-excede]="excede('correoestudiante')">{{ largo('correoestudiante') }}/{{ max('correoestudiante') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input matInput [maxlength]="max('telefono')" [(ngModel)]="datos.telefono">
              @if (cercaDelLimite('telefono')) {
                <mat-hint align="end" [class.hint-excede]="excede('telefono')">{{ largo('telefono') }}/{{ max('telefono') }}</mat-hint>
              }
            </mat-form-field>
          </div>

          <div class="section-header">
            <mat-icon>location_on</mat-icon>
            <span>Ubicación y Domicilio</span>
          </div>
          <div class="row row-3">
            <mat-form-field appearance="outline">
              <mat-label>País</mat-label>
              <input matInput [maxlength]="max('pais')" [(ngModel)]="datos.pais">
              @if (cercaDelLimite('pais')) {
                <mat-hint align="end" [class.hint-excede]="excede('pais')">{{ largo('pais') }}/{{ max('pais') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Provincia</mat-label>
              <input matInput [maxlength]="max('provincia')" [(ngModel)]="datos.provincia">
              @if (cercaDelLimite('provincia')) {
                <mat-hint align="end" [class.hint-excede]="excede('provincia')">{{ largo('provincia') }}/{{ max('provincia') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Cantón</mat-label>
              <input matInput [maxlength]="max('canton')" [(ngModel)]="datos.canton">
              @if (cercaDelLimite('canton')) {
                <mat-hint align="end" [class.hint-excede]="excede('canton')">{{ largo('canton') }}/{{ max('canton') }}</mat-hint>
              }
            </mat-form-field>
          </div>
          <div class="row row-3">
            <mat-form-field appearance="outline">
              <mat-label>Calle Principal</mat-label>
              <input matInput [maxlength]="max('calle')" [(ngModel)]="datos.calle">
              @if (cercaDelLimite('calle')) {
                <mat-hint align="end" [class.hint-excede]="excede('calle')">{{ largo('calle') }}/{{ max('calle') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Número</mat-label>
              <input matInput [maxlength]="max('num')" [(ngModel)]="datos.num">
              @if (cercaDelLimite('num')) {
                <mat-hint align="end" [class.hint-excede]="excede('num')">{{ largo('num') }}/{{ max('num') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Transversal</mat-label>
              <input matInput [maxlength]="max('transversal')" [(ngModel)]="datos.transversal">
              @if (cercaDelLimite('transversal')) {
                <mat-hint align="end" [class.hint-excede]="excede('transversal')">{{ largo('transversal') }}/{{ max('transversal') }}</mat-hint>
              }
            </mat-form-field>
          </div>

          <div class="section-header">
            <mat-icon>school</mat-icon>
            <span>Datos Académicos</span>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Nivel de Estudio</mat-label>
              <mat-select [(ngModel)]="datos.nivelEstudio" (ngModelChange)="onNivelChange()">
                <mat-option value="a1">A.1 — Primaria o 7mo Año Básico</mat-option>
                <mat-option value="a2">A.2 — Ciclo Básico o 10mo Año Básico</mat-option>
                <mat-option value="a4">A.4 — Título</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (datos.nivelEstudio === 'a1') {
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Conferido por (Establecimiento A.1)</mat-label>
                <input matInput [maxlength]="max('conferidoPorA1')" [(ngModel)]="datos.conferidoPorA1">
                @if (cercaDelLimite('conferidoPorA1')) {
                  <mat-hint align="end" [class.hint-excede]="excede('conferidoPorA1')">{{ largo('conferidoPorA1') }}/{{ max('conferidoPorA1') }}</mat-hint>
                }
              </mat-form-field>
            </div>
          }

          @if (datos.nivelEstudio === 'a2') {
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Conferido por (Establecimiento A.2)</mat-label>
                <input matInput [maxlength]="max('conferidoPorA2')" [(ngModel)]="datos.conferidoPorA2">
                @if (cercaDelLimite('conferidoPorA2')) {
                  <mat-hint align="end" [class.hint-excede]="excede('conferidoPorA2')">{{ largo('conferidoPorA2') }}/{{ max('conferidoPorA2') }}</mat-hint>
                }
              </mat-form-field>
            </div>
          }

          @if (datos.nivelEstudio === 'a4') {
            <div class="row row-3">
              <mat-form-field appearance="outline">
                <mat-label>Tipo de Título</mat-label>
                <mat-select [(ngModel)]="datos.tipoBachiller">
                  <mat-option value="Bachiller">Bachiller</mat-option>
                  <mat-option value="Superior">Superior</mat-option>
                  <mat-option value="Otro">Otro</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Especialidad</mat-label>
                <input matInput [maxlength]="max('especialidad')" [(ngModel)]="datos.especialidad">
                @if (cercaDelLimite('especialidad')) {
                  <mat-hint align="end" [class.hint-excede]="excede('especialidad')">{{ largo('especialidad') }}/{{ max('especialidad') }}</mat-hint>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Unidad Educativa (Conferido por)</mat-label>
                <input matInput [maxlength]="max('unidadeducativa')" [(ngModel)]="datos.unidadeducativa">
                @if (cercaDelLimite('unidadeducativa')) {
                  <mat-hint align="end" [class.hint-excede]="excede('unidadeducativa')">{{ largo('unidadeducativa') }}/{{ max('unidadeducativa') }}</mat-hint>
                }
              </mat-form-field>
            </div>
          }

          <div class="section-header">
            <mat-icon>family_restroom</mat-icon>
            <span>Datos Familiares y Representante</span>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre del Padre</mat-label>
              <input matInput [maxlength]="max('nombrepapa')" [(ngModel)]="datos.nombrepapa">
              @if (cercaDelLimite('nombrepapa')) {
                <mat-hint align="end" [class.hint-excede]="excede('nombrepapa')">{{ largo('nombrepapa') }}/{{ max('nombrepapa') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nombre de la Madre</mat-label>
              <input matInput [maxlength]="max('nombremama')" [(ngModel)]="datos.nombremama">
              @if (cercaDelLimite('nombremama')) {
                <mat-hint align="end" [class.hint-excede]="excede('nombremama')">{{ largo('nombremama') }}/{{ max('nombremama') }}</mat-hint>
              }
            </mat-form-field>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Representante Legal</mat-label>
              <input matInput [maxlength]="max('nombrerepresentante')" [(ngModel)]="datos.nombrerepresentante">
              @if (cercaDelLimite('nombrerepresentante')) {
                <mat-hint align="end" [class.hint-excede]="excede('nombrerepresentante')">{{ largo('nombrerepresentante') }}/{{ max('nombrerepresentante') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Teléfono Representante</mat-label>
              <input matInput [maxlength]="max('telefonorepresentante')" [(ngModel)]="datos.telefonorepresentante">
              @if (cercaDelLimite('telefonorepresentante')) {
                <mat-hint align="end" [class.hint-excede]="excede('telefonorepresentante')">{{ largo('telefonorepresentante') }}/{{ max('telefonorepresentante') }}</mat-hint>
              }
            </mat-form-field>
          </div>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Domicilio Representante</mat-label>
              <input matInput [maxlength]="max('domiciliorepresentante')" [(ngModel)]="datos.domiciliorepresentante">
              @if (cercaDelLimite('domiciliorepresentante')) {
                <mat-hint align="end" [class.hint-excede]="excede('domiciliorepresentante')">{{ largo('domiciliorepresentante') }}/{{ max('domiciliorepresentante') }}</mat-hint>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Lugar y Fecha Certificado</mat-label>
              <input matInput [maxlength]="max('lugarfechacertificado')" [(ngModel)]="datos.lugarfechacertificado">
              @if (cercaDelLimite('lugarfechacertificado')) {
                <mat-hint align="end" [class.hint-excede]="excede('lugarfechacertificado')">{{ largo('lugarfechacertificado') }}/{{ max('lugarfechacertificado') }}</mat-hint>
              }
            </mat-form-field>
          </div>

        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()" class="btn-cancelar">CANCELAR</button>
        <button mat-raised-button (click)="guardar()" class="btn-guardar">
          <mat-icon>save</mat-icon> GUARDAR CAMBIOS
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .hint-excede { color: #dc2626 !important; font-weight: 700; }

    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1a2a5e, #0d1a3e);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      mat-icon { color: #c8a84b; }
      h2 { margin: 0; font-size: 17px; font-weight: 700; }
    }

    .close-btn { color: rgba(255,255,255,0.7); }

    .custom-content {
      padding: 24px !important;
      overflow-x: hidden;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 20px 0 10px;
      color: #1a2a5e;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #f0f2f8;
      padding-bottom: 6px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #c8a84b; }
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
    }

    .row-3 { grid-template-columns: 1fr 1fr 1fr; }

    mat-form-field { width: 100%; }

    mat-dialog-actions {
      padding: 16px 24px !important;
      background: #f8f9fc;
      border-top: 1px solid #eee;
      gap: 12px;
    }

    .btn-guardar {
      background: linear-gradient(135deg, #1a2a5e, #2a4f9f) !important;
      color: white !important;
      padding: 0 24px !important;
    }

    .btn-cancelar { color: #666 !important; }

    /* Celular: formulario en una columna y botones a todo el ancho */
    @media (max-width: 768px) {
      .dialog-header { padding: 12px 16px; }
      .custom-content { padding: 16px !important; }
      .row, .row-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class EditarMatriculaDialog {
  datos: any;

  // Límites de longitud (ver services/matricula-limites.ts)
  lim = LIMITES_MATRICULA;

  constructor(
    public dialogRef: MatDialogRef<EditarMatriculaDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {
    this.datos = { ...data };
  }

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

  // Solo cierra (y guarda) si ningún campo supera el máximo de la base de datos.
  guardar() {
    const excedidos = camposExcedidos(this.datos);
    if (excedidos.length) {
      this.snackBar.open(
        `Hay campos demasiado largos: ${excedidos.join(', ')}`,
        'OK',
        { duration: 7000, panelClass: ['app-snackbar', 'app-snackbar-error'] }
      );
      return;
    }
    const errorCedula = this.errorCedula();
    if (errorCedula) {
      this.snackBar.open(errorCedula, 'OK', { duration: 5000, panelClass: ['app-snackbar', 'app-snackbar-error'] });
      return;
    }
    this.dialogRef.close(this.datos);
  }

  // Igual que el backend: solo se valida si la cédula cambió, para no bloquear
  // la edición de registros antiguos que ya tenían una cédula mal ingresada.
  errorCedula(): string | null {
    const id = String(this.datos.cedula ?? '').trim();
    if (id === String(this.data.cedula ?? '').trim()) return null;
    return validarIdentificacion(id);
  }

  onNivelChange() {
    this.datos.tipoBachiller = '';
    this.datos.conferidoPorA1 = '';
    this.datos.conferidoPorA2 = '';
    this.datos.unidadeducativa = '';
    this.datos.especialidad = '';
  }
}

// ===== COMPONENTE PRINCIPAL =====
@Component({
  selector: 'app-detalle-curso',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, DatePipe],

  templateUrl: './detalle-curso.html',
  styleUrl: './detalle-curso.scss'
})
export class DetalleCurso implements OnInit {
  private confirmacion = inject(Confirmacion);
  curso: any = null;
  loading = true;
  descargando: number | null = null;
  columnas = ['nombres', 'apellidos', 'cedula', 'telefono', 'acciones'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private matriculaService: MatriculaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoService.obtenerCurso(id).subscribe({
      next: (curso) => {
        this.curso = curso;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irAMatricular() {
    this.router.navigate(['/matriculas/nueva'], { queryParams: { cursoId: this.curso.id } });
  }

  irANotas() {
    this.router.navigate(['/cursos', this.curso.id, 'notas']);
  }

  irACuadroFinal() {
    this.router.navigate(['/supletorios', this.curso.id]);
  }

  editarMatricula(matricula: any) {
    const dialogRef = this.dialog.open(EditarMatriculaDialog, {
      width: '1000px',
      maxHeight: '90vh',
      data: { ...matricula }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.matriculaService.actualizarMatricula(matricula.id, result).subscribe({
          next: () => {
            this.snackBar.open('Datos del estudiante actualizados correctamente', 'OK', { duration: 3000 });
            this.ngOnInit();
          },
          error: (e) => this.snackBar.open(e?.error?.error || 'No se pudo actualizar al estudiante', 'OK',
            { duration: 5000, panelClass: ['app-snackbar', 'app-snackbar-error'] })
        });
      }
    });
  }

  eliminarEstudiante(matricula: any) {
    this.confirmacion.eliminar(
      'Eliminar estudiante',
      `¿Deseas eliminar a ${matricula.nombres} ${matricula.apellidos} de este curso?`
    ).subscribe(ok => {
      if (!ok) return;
      this.matriculaService.eliminarMatricula(matricula.id).subscribe({
        next: () => {
          this.snackBar.open(`${matricula.nombres} ${matricula.apellidos} fue eliminado del curso`, 'OK', { duration: 3000 });
          this.ngOnInit();
        },
        error: (e) => this.snackBar.open(e?.error?.error || 'No se pudo eliminar al estudiante', 'OK', { duration: 4000, panelClass: ['app-snackbar', 'app-snackbar-error'] })
      });
    });
  }

  descargarMatricula(matricula: any) {
    this.descargando = matricula.id;
    this.matriculaService.descargarMatricula(matricula.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matricula_${matricula.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargando = null;
      },
      error: () => {
        this.descargando = null;
        this.snackBar.open('Error al descargar matrícula', 'OK', { duration: 3000 });
      }
    });
  }

  descargarCertificado(matricula: any) {
    this.descargando = matricula.id;
    this.matriculaService.descargarCertificado(matricula.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_${matricula.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.descargando = null;
      },
      error: () => {
        this.descargando = null;
        this.snackBar.open('Error al descargar certificado', 'OK', { duration: 3000 });
      }
    });
  }


nuevaSubmateriaUnica = '';

getSubmateriasUnicas(): any[] {
  const subs = this.curso?.materias?.filter((m: any) => m.esSubmateria && m.materiaParent === 'Práctica') || [];
  return subs;
}

// ── Vista organizada de materias del curso ──
expandido: { [parent: string]: boolean } = { 'disciplina': false };

toggleParent(parent: string) {
  this.expandido[parent] = !this.expandido[parent];
}

// Submaterias de un parent ('Práctica' | 'Teoría'), ordenadas por nombre
getSubmateriasDe(parent: string): any[] {
  return (this.curso?.materias?.filter((m: any) => m.esSubmateria && m.materiaParent === parent) || [])
    .sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));
}

// Materias normales (ni Práctica/Teoría principales ni submaterias)
getMateriasNormales(): any[] {
  return (this.curso?.materias?.filter((m: any) =>
    !m.esSubmateria && m.nombre !== 'Práctica' && m.nombre !== 'Teoría') || [])
    .sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));
}

// Nombre del docente encargado de una materia (o 'Sin asignar')
docenteDe(materia: any): string {
  const d = materia?.profesor;
  return d ? `${d.nombre} ${d.apellido}` : 'Sin asignar';
}

agregarSubmateriaDoble() {
  const nombre = this.nuevaSubmateriaUnica?.trim();
  if (!nombre) {
    this.snackBar.open('Ingresa el nombre de la submateria', 'OK', { duration: 3000 });
    return;
  }
  this.cursoService.agregarSubmateria(this.curso.id, nombre).subscribe({
    next: () => {
      this.snackBar.open('Submateria agregada en Práctica y Teoría', 'OK', { duration: 3000 });
      this.nuevaSubmateriaUnica = '';
      this.ngOnInit();
    },
    error: () => this.snackBar.open('Error al agregar submateria', 'OK', { duration: 3000 })
  });
}

eliminarSubmateriaDoble(nombre: string) {
  this.confirmacion.eliminar('Eliminar submateria', `¿Deseas eliminar "${nombre}" de Práctica y Teoría?`).subscribe(ok => {
    if (!ok) return;
    const subs = this.curso?.materias?.filter((m: any) => m.esSubmateria && m.nombre === nombre) || [];
    const deletes = subs.map((s: any) => this.cursoService.eliminarSubmateria(s.id));
    let completados = 0;
    deletes.forEach((d: any) => d.subscribe({
      next: () => {
        completados++;
        if (completados === deletes.length) {
          this.snackBar.open(`Submateria "${nombre}" eliminada correctamente`, 'OK', { duration: 3000 });
          this.ngOnInit();
        }
      },
      error: (e: any) => this.snackBar.open(e?.error?.error || 'No se pudo eliminar la submateria', 'OK', { duration: 4000, panelClass: ['app-snackbar', 'app-snackbar-error'] })
    }));
  });
}

  volver() {
    this.router.navigate(['/cursos']);
  }
}