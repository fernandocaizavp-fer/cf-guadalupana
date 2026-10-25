import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Tarjeta de "sin datos" con la identidad del sistema (azul + dorado).
 * Se usa cuando una lista está vacía (p. ej. no hay tareas en el semestre),
 * para que todas las pantallas muestren el mismo aviso en lugar de texto suelto.
 */
@Component({
  selector: 'app-estado-vacio',
  imports: [MatIconModule],
  template: `
    <div class="estado-vacio">
      <div class="ev-icono">
        <mat-icon>{{ icono }}</mat-icon>
      </div>
      <h3>{{ titulo }}</h3>
      @if (mensaje) {
        <p>{{ mensaje }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .estado-vacio {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      max-width: 460px;
      margin: 32px auto;
      padding: 40px 28px;
      background: #ffffff;
      border: 2px dashed #d6dcef;
      border-radius: 20px;
      box-shadow: 0 8px 24px rgba(26, 42, 94, 0.06);
      animation: ev-aparecer 0.35s ease-out;
    }

    .ev-icono {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 76px;
      height: 76px;
      margin-bottom: 6px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a2a5e, #2a4f9f);
      box-shadow: 0 8px 20px rgba(26, 42, 94, 0.25);

      mat-icon {
        color: #c8a84b;
        font-size: 38px;
        width: 38px;
        height: 38px;
      }
    }

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #1a2a5e;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #64748b;
    }

    @keyframes ev-aparecer {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class EstadoVacio {
  @Input() icono = 'inbox';
  @Input() titulo = 'Sin registros';
  @Input() mensaje = '';
}
