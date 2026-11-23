import { Component, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-recuperar-password',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss'
})
export class RecuperarPassword {
  // Paso 1 = pedir correo, Paso 2 = ingresar código y nueva contraseña
  paso = 1;

  correo = '';
  codigo = '';
  passwordNueva = '';
  passwordConfirmar = '';

  error = '';
  exito = '';
  loading = false;

  @ViewChild('inputCodigo') inputCodigo?: ElementRef<HTMLInputElement>;
  @ViewChild('inputPassword') inputPassword?: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Validaciones visuales
  get tieneLongitud(): boolean { return this.passwordNueva.length >= 8; }
  get tieneMayuscula(): boolean { return /[A-Z]/.test(this.passwordNueva); }
  get tieneNumero(): boolean { return /[0-9]/.test(this.passwordNueva); }
  get coinciden(): boolean { return this.passwordNueva === this.passwordConfirmar && this.passwordConfirmar !== ''; }
  get passwordValida(): boolean {
    return this.tieneLongitud && this.tieneMayuscula && this.tieneNumero && this.coinciden;
  }

  // PASO 1: solicitar el código. El servidor lo genera y lo envía al correo;
  // el código nunca llega al navegador.
  enviarCodigo() {
    if (this.loading) return;
    this.error = '';
    this.exito = '';

    if (!this.correo) {
      this.error = 'Ingrese su correo electrónico';
      return;
    }

    this.loading = true;
    this.authService.solicitarRecuperacion(this.correo).subscribe({
      next: (res) => {
        this.exito = res?.message || 'Si el correo está registrado, recibirá un código de recuperación';
        this.loading = false;
        this.paso = 2;
        // La pantalla se actualiza al instante: antes se quedaba en el paso 1
        // hasta que el usuario hacía clic, aunque el correo ya había llegado.
        this.cdr.detectChanges();
        setTimeout(() => this.inputCodigo?.nativeElement?.focus(), 100);
      },
      error: (err) => {
        this.error = err.error?.error || 'No se pudo enviar el correo. Intente de nuevo';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Al completar los 6 dígitos del código, pasa solo al campo de la contraseña.
  onCodigoChange() {
    if (this.codigo && this.codigo.trim().length === 6) {
      setTimeout(() => this.inputPassword?.nativeElement?.focus(), 50);
    }
  }

  // PASO 2: validar código y cambiar la contraseña
  restablecer() {
    if (this.loading) return;
    this.error = '';
    this.exito = '';

    if (!this.codigo) {
      this.error = 'Ingrese el código que recibió';
      return;
    }
    if (!this.passwordValida) {
      this.error = 'La contraseña no cumple los requisitos';
      return;
    }

    this.loading = true;
    this.authService.restablecerPassword(this.correo, this.codigo.trim(), this.passwordNueva).subscribe({
      next: () => {
        this.exito = 'Contraseña restablecida. Ya puede iniciar sesión';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Código inválido o expirado';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}
