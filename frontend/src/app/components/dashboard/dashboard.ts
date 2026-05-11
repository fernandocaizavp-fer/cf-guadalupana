import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  usuario: any;

  constructor(private authService: AuthService, private router: Router) {
    this.usuario = this.authService.getUsuario();
  }

  irANuevaMatricula() {
    this.router.navigate(['/matriculas/nueva']);
  }

  irAReportes() {
    this.router.navigate(['/reportes']);
  }
  
  irACursos() {
    this.router.navigate(['/cursos']);
  }

  irADocentes() {
    this.router.navigate(['/docentes']);
  }

  irAAnuncios() {
    this.router.navigate(['/anuncios']);
  }

  irADocumentos() {
    this.router.navigate(['/documentos']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}