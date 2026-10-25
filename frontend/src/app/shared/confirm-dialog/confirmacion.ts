import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmData } from './confirm-dialog';

/**
 * Reemplaza al confirm() nativo del navegador por el diálogo con la identidad
 * del sistema. Emite true solo si el usuario pulsa el botón de confirmar
 * (cerrar con Esc o clic afuera cuenta como cancelar).
 */
@Injectable({ providedIn: 'root' })
export class Confirmacion {
  private dialog = inject(MatDialog);

  preguntar(data: ConfirmData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialog, { width: '400px', maxWidth: '92vw', autoFocus: false, data })
      .afterClosed()
      .pipe(map(ok => ok === true));
  }

  // Atajo para eliminaciones: diálogo rojo con ícono de basurero.
  eliminar(titulo: string, mensaje: string, confirmText = 'Eliminar'): Observable<boolean> {
    return this.preguntar({ titulo, mensaje, confirmText, icon: 'delete_outline', peligro: true });
  }
}
