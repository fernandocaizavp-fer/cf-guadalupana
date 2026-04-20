import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../services/auth';
import { MatriculaService } from '../../../services/matricula';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-estudiante',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule],
  templateUrl: './dashboard-estudiante.html',
  styleUrl: './dashboard-estudiante.scss'
})
export class DashboardEstudiante implements OnInit {
  usuario: any;
  matricula: any = null;
  loading = true;
  columnas = ['materia', 'nota'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private matriculaService: MatriculaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.usuario = this.authService.getUsuario();
  }

  ngOnInit() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.get(`http://localhost:3001/api/usuarios/perfil-estudiante/${this.usuario.id}`, { headers }).subscribe({
      next: (matricula: any) => {
        this.matricula = matricula;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  descargarCertificado() {
    if (!this.matricula) return;
    this.matriculaService.descargarCertificado(this.matricula.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_${this.matricula.cedula}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error al descargar certificado', 'OK', { duration: 3000 })
    });
  }

  calcularPromedio(): string {
    if (!this.matricula?.notas?.length) return '-';
    const suma = this.matricula.notas.reduce((a: number, b: any) => a + b.valor, 0);
    return (suma / this.matricula.notas.length).toFixed(2);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}