import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class SuplетorioService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  guardarMasivo(supletorios: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/supletorios/masivo`, { supletorios }, {
      headers: this.getHeaders()
    });
  }

  generarAL15(cursoId: number, lugarFecha: string, jornada: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/supletorios/al15/${cursoId}?lugarFecha=${encodeURIComponent(lugarFecha)}&jornada=${encodeURIComponent(jornada)}`,
      { headers: this.getHeaders(), responseType: 'blob' }
    );
  }
}