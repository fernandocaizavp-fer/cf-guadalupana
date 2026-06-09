import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {
  private apiUrl = 'https://cf-guadalupana-production.up.railway.app/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  crearMatricula(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/matriculas`, datos, {
      headers: this.getHeaders()
    });
  }

  descargarMatricula(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documentos/matricula/${id}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  descargarCertificado(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/documentos/certificado/${id}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  actualizarMatricula(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/matriculas/${id}`, datos, {
      headers: this.getHeaders()
    });
  }

  eliminarMatricula(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/matriculas/${id}`, {
      headers: this.getHeaders()
    });
  }

  getCursos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos`, {
      headers: this.getHeaders()
    });
  }

  consultarCedula(cedula: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cedula/${cedula}`, {
      headers: this.getHeaders()
    });
  }
}