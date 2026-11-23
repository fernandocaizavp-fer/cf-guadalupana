import { Component, ElementRef, ViewChild, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// "Lugar y fecha" de los documentos oficiales (AL9, AL14, AL15, matrícula...).
// Los campos se precargan con la fecha actual y siguen siendo texto editable;
// el botón de calendario solo reescribe la fecha conservando el lugar escrito.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const LUGAR_POR_DEFECTO = 'Riobamba';

// Ej: "Riobamba, 23 de noviembre del 2026" (mismo formato que los ejemplos de los formularios)
export function lugarFechaHoy(fecha: Date = new Date(), lugar: string = LUGAR_POR_DEFECTO): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${lugar}, ${dia} de ${MESES[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}

// Cambia la fecha de un texto "Lugar, fecha" por la elegida (yyyy-MM-dd), sin tocar el lugar.
export function cambiarFecha(texto: string, iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return texto;
  const lugar = (texto || '').split(',')[0].trim() || LUGAR_POR_DEFECTO;
  return lugarFechaHoy(new Date(anio, mes - 1, dia), lugar);
}

// Botón con icono de calendario para poner junto a un campo "Lugar y fecha".
// Uso: <app-boton-calendario matSuffix [(valor)]="lugarFecha" />
@Component({
  selector: 'app-boton-calendario',
  imports: [MatIconModule],
  template: `
    <button type="button" class="boton" (click)="abrir()" title="Elegir fecha" aria-label="Elegir fecha en el calendario">
      <mat-icon>calendar_month</mat-icon>
    </button>
    <input #selector type="date" class="selector" tabindex="-1" aria-hidden="true" (change)="elegir(selector.value)">
  `,
  styles: [`
    :host { position: relative; display: inline-flex; align-items: center; }
    .boton {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; padding: 0; margin: 0 4px;
      border: none; border-radius: 50%; background: transparent;
      color: #1a2a5e; cursor: pointer; transition: background 0.15s;
    }
    .boton:hover { background: rgba(26, 42, 94, 0.08); }
    .boton:focus-visible { outline: 2px solid #2a4f9f; outline-offset: 1px; }
    /* El input nativo queda invisible bajo el botón: solo aporta el calendario del navegador. */
    .selector {
      position: absolute; left: 0; bottom: 0; width: 1px; height: 1px;
      opacity: 0; border: 0; padding: 0; pointer-events: none;
    }
  `]
})
export class BotonCalendario {
  valor = model<string>('');
  @ViewChild('selector') selector!: ElementRef<HTMLInputElement>;

  abrir() {
    const input = this.selector.nativeElement;
    try {
      input.showPicker();
    } catch {
      // Navegadores sin showPicker(): el clic abre el calendario nativo.
      input.click();
    }
  }

  elegir(iso: string) {
    if (!iso) return;
    this.valor.set(cambiarFecha(this.valor(), iso));
    this.selector.nativeElement.value = '';
  }
}
