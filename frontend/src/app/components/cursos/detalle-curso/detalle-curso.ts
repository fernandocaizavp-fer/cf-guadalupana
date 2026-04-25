import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
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
import { DatePipe } from '@angular/common';
import { CursoService } from '../../../services/curso';
import { MatriculaService } from '../../../services/matricula';

// ===== DIALOG EDITAR =====
@Component({
  selector: 'app-editar-matricula-dialog',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Editar Estudiante</h2>
    <mat-dialog-content>
      <div class="dialog-grid">
        <h4 class="section">Datos Personales</h4>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Apellidos</mat-label><input matInput [(ngModel)]="datos.apellidos"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nombres</mat-label><input matInput [(ngModel)]="datos.nombres"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Cédula</mat-label><input matInput [(ngModel)]="datos.cedula"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput [(ngModel)]="datos.telefono"></mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>País</mat-label><input matInput [(ngModel)]="datos.pais"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Provincia</mat-label><input matInput [(ngModel)]="datos.provincia"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Cantón</mat-label><input matInput [(ngModel)]="datos.canton"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ciudad</mat-label><input matInput [(ngModel)]="datos.ciudad"></mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Calle</mat-label><input matInput [(ngModel)]="datos.calle"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Número</mat-label><input matInput [(ngModel)]="datos.num"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Transversal</mat-label><input matInput [(ngModel)]="datos.transversal"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Correo</mat-label><input matInput [(ngModel)]="datos.correoestudiante"></mat-form-field>
        </div>
        <mat-divider></mat-divider>
        <h4 class="section">Datos Familiares</h4>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Nombre Padre</mat-label><input matInput [(ngModel)]="datos.nombrepapa"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ocupación Padre</mat-label><input matInput [(ngModel)]="datos.ocupacionpapa"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nombre Madre</mat-label><input matInput [(ngModel)]="datos.nombremama"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ocupación Madre</mat-label><input matInput [(ngModel)]="datos.ocupacionmama"></mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Representante</mat-label><input matInput [(ngModel)]="datos.nombrerepresentante"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Teléfono Representante</mat-label><input matInput [(ngModel)]="datos.telefonorepresentante"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Domicilio Representante</mat-label><input matInput [(ngModel)]="datos.domiciliorepresentante"></mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close()">CANCELAR</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(datos)">GUARDAR</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-grid { padding: 8px 0; }
    .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .section { color: #1a2a5e; margin: 12px 0 8px; font-size: 14px; font-weight: 600; }
    mat-form-field { width: 100%; }
  `]
})
export class EditarMatriculaDialog {
  datos: any;
  constructor(
    public dialogRef: MatDialogRef<EditarMatriculaDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.datos = { ...data };
  }
}

// ===== COMPONENTE PRINCIPAL =====
@Component({
  selector: 'app-detalle-curso',
  imports: [FormsModule, MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, DatePipe],
  templateUrl: './detalle-curso.html',
  styleUrl: './detalle-curso.scss'
})
export class DetalleCurso implements OnInit {
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
      width: '900px',
      maxHeight: '90vh',
      data: { ...matricula }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.matriculaService.actualizarMatricula(matricula.id, result).subscribe({
          next: () => {
            this.snackBar.open('Estudiante actualizado', 'OK', { duration: 3000 });
            this.ngOnInit();
          },
          error: () => this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 })
        });
      }
    });
  }

  eliminarEstudiante(matricula: any) {
    if (confirm(`¿Eliminar a ${matricula.nombres} ${matricula.apellidos}?`)) {
      this.matriculaService.eliminarMatricula(matricula.id).subscribe({
        next: () => {
          this.snackBar.open('Estudiante eliminado', 'OK', { duration: 3000 });
          this.ngOnInit();
        },
        error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
      });
    }
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

  volver() {
    this.router.navigate(['/cursos']);
  }
}