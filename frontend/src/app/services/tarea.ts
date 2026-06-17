import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private apiUrl = 'https://cf-guadalupana-production.up.railway.app/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getTareasPorMateria(materiaId: number, semestre?: number): Observable<any[]> {
    const params = semestre ? `?semestre=${semestre}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/tareas/materia/${materiaId}${params}`, {
      headers: this.getHeaders()
    });
  }

  crearTarea(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tareas`, datos, {
      headers: this.getHeaders()
    });
  }

  actualizarTarea(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tareas/${id}`, datos, {
      headers: this.getHeaders()
    });
  }

  guardarNotas(notas: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/tareas/notas`, { notas }, {
      headers: this.getHeaders()
    });
  }

  eliminarTarea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tareas/${id}`, {
      headers: this.getHeaders()
    });
  }

  getNotasCursoSemestre(cursoId: number, semestre?: number): Observable<any> {
    const params = semestre ? `?semestre=${semestre}` : '';
    return this.http.get(`${this.apiUrl}/tareas/curso/${cursoId}${params}`, {
      headers: this.getHeaders()
    });
  }

  descargarAL14(cursoId: number, lugarFecha: string, semestre: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/notas/al14/${cursoId}?lugarFecha=${encodeURIComponent(lugarFecha)}&semestre=${semestre}`,
      { headers: this.getHeaders(), responseType: 'blob' }
    );
  }
}