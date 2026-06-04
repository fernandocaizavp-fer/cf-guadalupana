import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = 'https://cf-guadalupana-production.up.railway.app/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  listarCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cursos?t=${Date.now()}`, {
      headers: this.getHeaders()
    });
  }

  obtenerCurso(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/${id}`, {
      headers: this.getHeaders()
    });
  }

agregarSubmateria(cursoId: number, nombre: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/cursos/submaterias`, { cursoId, nombre }, {
    headers: this.getHeaders()
  });
}

    eliminarSubmateria(id: number): Observable<any> {
      return this.http.delete(`${this.apiUrl}/cursos/submaterias/${id}`, {
        headers: this.getHeaders()
      });
    }

  crearCurso(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cursos`, datos, {
      headers: this.getHeaders()
    });
  }
  eliminarCurso(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/cursos/${id}`, {
    headers: this.getHeaders()
  });
}
}