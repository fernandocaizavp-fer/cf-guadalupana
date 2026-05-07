import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  listarDocentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios/docentes`, {
      headers: this.getHeaders()
    });
  }

  crearDocente(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/docentes`, datos, {
      headers: this.getHeaders()
    });
  }

  actualizarDocente(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/docentes/${id}`, datos, {
      headers: this.getHeaders()
    });
  }

  eliminarDocente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/docentes/${id}`, {
      headers: this.getHeaders()
    });
  }

  asignarProfesor(materiaId: number, profesorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/asignar-materia`, { materiaId, profesorId }, {
      headers: this.getHeaders()
    });
  }

  asignarProfesorPrincipal(cursoId: number, profesorId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/asignar-profesor-principal`, { cursoId, profesorId }, {
      headers: this.getHeaders()
    });
  }

  asignarProfesorPrincipalMateria(materiaId: number, profesorId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/usuarios/asignar-profesor-principal-materia`, { materiaId, profesorId }, {
    headers: this.getHeaders()
  });
}

  getMateriasCurso(cursoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cursos/${cursoId}`, {
      headers: this.getHeaders()
    });
  }
}