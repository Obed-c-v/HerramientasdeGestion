import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  esRegistro: boolean = false;
  verPassword: boolean = false;
  verNuevaPassword: boolean = false;

  // 🔄 FLUJO DE AUTH
  authStep: 'LOGIN' | 'OTP' | 'CHANGE_PASSWORD' = 'LOGIN';

  // 🧑 DATOS
  primerNombre = '';
  segundoNombre = '';
  apellidoPaterno = '';
  apellidoMaterno = '';
  correo = '';
  password = '';
  edad = '';
  sexo = '';
  
  // PASSWORD NUEVA
  newPassword = '';
  confirmPassword = '';

  // 🔐 MFA
  codigoMFA: string = '';
  codigoMFAArray: string[] = ['', '', '', '', '', ''];

  // 🧪 VALIDACIONES Y ERRORES INSTANTÁNEOS
  errores: { [key: string]: string } = {};
  tocados: { [key: string]: boolean } = {};
  validos: { [key: string]: boolean } = {};

  isLoading = false;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    if (this.authService.hasToken()) {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  // 👁 PASSWORD
  togglePassword() {
    this.verPassword = !this.verPassword;
  }

  // 🔁 CAMBIAR LOGIN / REGISTRO
  toggleModo() {
    this.esRegistro = !this.esRegistro;
    // Resetear formularios y validaciones
    this.primerNombre = '';
    this.segundoNombre = '';
    this.apellidoPaterno = '';
    this.apellidoMaterno = '';
    this.correo = '';
    this.password = '';
    this.edad = '';
    this.sexo = '';
    this.errores = {};
    this.tocados = {};
    this.validos = {};
  }

  setModo(registro: boolean) {
    if (this.esRegistro !== registro) {
      this.toggleModo();
    }
  }

  // 🧪 VALIDACIONES EN TIEMPO REAL
  marcarTocado(campo: string) {
    this.tocados[campo] = true;
    this.validarCampo(campo);
  }

  validarCampo(campo: string) {
    switch (campo) {
      case 'correo':
        this.validarCorreo();
        break;
      case 'password':
        this.validarPassword();
        break;
      case 'newPassword':
        this.validarNuevaPassword();
        break;
      case 'confirmPassword':
        this.validarConfirmPassword();
        break;
      case 'primerNombre':
      case 'apellidoPaterno':
      case 'apellidoMaterno':
        this.validarNombreObligatorio(campo);
        break;
      case 'segundoNombre':
        this.validarNombreOpcional(campo);
        break;
      case 'edad':
        this.validarEdadCampo();
        break;
      case 'sexo':
        this.validarSexoCampo();
        break;
    }
  }

  validarCorreo() {
    const valor = this.correo.trim();
    if (!valor) {
      this.errores['correo'] = 'El correo electrónico es requerido.';
      this.validos['correo'] = false;
    } else {
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!regex.test(valor)) {
        this.errores['correo'] = 'Ingrese un formato de correo electrónico válido (ej: doctor@spark.com).';
        this.validos['correo'] = false;
      } else {
        delete this.errores['correo'];
        this.validos['correo'] = true;
      }
    }
  }

  validarPassword() {
    const valor = this.password;
    if (!valor) {
      this.errores['password'] = 'La contraseña es requerida.';
      this.validos['password'] = false;
    } else {
      delete this.errores['password'];
      this.validos['password'] = true;
    }
  }

  validarNuevaPassword() {
    const valor = this.newPassword;
    if (!valor) {
      this.errores['newPassword'] = 'La contraseña es requerida.';
      this.validos['newPassword'] = false;
    } else if (valor.length < 8) {
      this.errores['newPassword'] = 'Mínimo 8 caracteres.';
      this.validos['newPassword'] = false;
    } else {
      const tieneMayuscula = /[A-Z]/.test(valor);
      const tieneMinuscula = /[a-z]/.test(valor);
      const tieneNumero = /[0-9]/.test(valor);
      
      if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
        this.errores['newPassword'] = 'Debe incluir 1 mayúscula, 1 minúscula y 1 número.';
        this.validos['newPassword'] = false;
      } else {
        delete this.errores['newPassword'];
        this.validos['newPassword'] = true;
      }
    }
    
    // Revalidar confirmación si ya fue tocada
    if (this.tocados['confirmPassword']) {
      this.validarConfirmPassword();
    }
  }

  validarConfirmPassword() {
    if (!this.confirmPassword) {
      this.errores['confirmPassword'] = 'Confirme su contraseña.';
      this.validos['confirmPassword'] = false;
    } else if (this.confirmPassword !== this.newPassword) {
      this.errores['confirmPassword'] = 'Las contraseñas no coinciden.';
      this.validos['confirmPassword'] = false;
    } else {
      delete this.errores['confirmPassword'];
      this.validos['confirmPassword'] = true;
    }
  }

  validarNombreObligatorio(campo: string) {
    const valor = (this as any)[campo].trim();
    if (!valor) {
      this.errores[campo] = 'Este campo es requerido.';
      this.validos[campo] = false;
    } else {
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
      if (!regex.test(valor)) {
        this.errores[campo] = 'Solo se permiten letras y espacios.';
        this.validos[campo] = false;
      } else {
        delete this.errores[campo];
        this.validos[campo] = true;
      }
    }
  }

  validarNombreOpcional(campo: string) {
    const valor = this.segundoNombre.trim();
    if (valor) {
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
      if (!regex.test(valor)) {
        this.errores[campo] = 'Solo se permiten letras y espacios.';
        this.validos[campo] = false;
      } else {
        delete this.errores[campo];
        this.validos[campo] = true;
      }
    } else {
      delete this.errores[campo];
      this.validos[campo] = false; // No es error, pero no se marca en verde
    }
  }

  validarEdadCampo() {
    const valor = this.edad;
    if (!valor) {
      this.errores['edad'] = 'La edad es requerida.';
      this.validos['edad'] = false;
    } else {
      const num = parseInt(valor, 10);
      if (isNaN(num) || num < 1 || num > 120) {
        this.errores['edad'] = 'Debe ser una edad válida entre 1 y 120 años.';
        this.validos['edad'] = false;
      } else {
        delete this.errores['edad'];
        this.validos['edad'] = true;
      }
    }
  }

  validarSexoCampo() {
    if (!this.sexo) {
      this.errores['sexo'] = 'El sexo es requerido.';
      this.validos['sexo'] = false;
    } else {
      delete this.errores['sexo'];
      this.validos['sexo'] = true;
    }
  }

  // 🧪 HABILITAR BOTONES
  get esLoginValido(): boolean {
    return (
      this.correo.trim().length > 0 &&
      this.password.length > 0 &&
      !this.errores['correo'] &&
      !this.errores['password']
    );
  }

  get esRegistroValido(): boolean {
    return (
      this.primerNombre.trim().length > 0 &&
      this.apellidoPaterno.trim().length > 0 &&
      this.apellidoMaterno.trim().length > 0 &&
      this.correo.trim().length > 0 &&
      this.password.length > 0 &&
      this.edad.trim().length > 0 &&
      this.sexo.length > 0 &&
      Object.keys(this.errores).length === 0
    );
  }

  get esCambioPasswordValido(): boolean {
    return (
      this.newPassword.length > 0 &&
      this.confirmPassword.length > 0 &&
      !this.errores['newPassword'] &&
      !this.errores['confirmPassword']
    );
  }

  // 🔐 LOGIN REAL API
  login() {
    this.marcarTocado('correo');
    this.marcarTocado('password');

    if (!this.esLoginValido) {
      alert('Complete los campos correctamente ❌');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.correo, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.requiresVerification) {
          // Es un paciente en su primer acceso
          this.authStep = 'OTP';
          this.codigoMFAArray = ['', '', '', '', '', ''];
          this.codigoMFA = '';
        } else if (res.token) {
          // Login directo exitoso
          this.router.navigate(['/tabs/tab1']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Error de conexión';
        alert(`Credenciales incorrectas ❌\n${msg}`);
      }
    });
  }

  // 📝 REGISTRO SIMULADO
  async registrar() {
    // Tocar todos los campos de registro
    this.marcarTocado('primerNombre');
    this.marcarTocado('segundoNombre');
    this.marcarTocado('apellidoPaterno');
    this.marcarTocado('apellidoMaterno');
    this.marcarTocado('correo');
    this.marcarTocado('password');
    this.marcarTocado('edad');
    this.marcarTocado('sexo');

    if (!this.esRegistroValido) {
      alert('Complete todos los campos requeridos correctamente ❌');
      return;
    }

    alert('¡Registro simulado exitoso! ✅\nAhora puedes iniciar sesión.');
    const correoRegistrado = this.correo;
    
    // Cambiar a login
    this.toggleModo();
    this.correo = correoRegistrado;
    this.marcarTocado('correo');
  }

  // 📲 VERIFICAR OTP REAL API
  verificarMFA() {
    if (this.codigoMFA.length !== 6) {
      alert('Ingresa el código completo de 6 dígitos ❌');
      return;
    }

    this.isLoading = true;
    this.authService.verifyCode(this.correo, this.codigoMFA).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.verified) {
          this.authStep = 'CHANGE_PASSWORD';
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Código inválido';
        alert(`Error al verificar ❌\n${msg}`);
      }
    });
  }

  // 🔄 REENVIAR OTP
  reenviarOTP() {
    this.isLoading = true;
    this.authService.resendCode(this.correo).subscribe({
      next: () => {
        this.isLoading = false;
        alert('✅ Se ha enviado un nuevo código a tu correo.');
        this.codigoMFAArray = ['', '', '', '', '', ''];
        this.codigoMFA = '';
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Error al reenviar código';
        alert(`Error ❌\n${msg}`);
      }
    });
  }

  // 🔑 CAMBIAR CONTRASEÑA INICIAL
  cambiarPassword() {
    this.marcarTocado('newPassword');
    this.marcarTocado('confirmPassword');

    if (!this.esCambioPasswordValido) {
      return;
    }

    this.isLoading = true;
    this.authService.changeInitialPassword(this.correo, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        alert('¡Contraseña actualizada y sesión iniciada! ✅');
        this.router.navigate(['/tabs/tab1']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Error al cambiar contraseña';
        alert(`Error ❌\n${msg}`);
      }
    });
  }

  // ❌ CANCELAR
  cancelarMFA() {
    this.authStep = 'LOGIN';
    this.codigoMFA = '';
    this.codigoMFAArray = ['', '', '', '', '', ''];
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // 2FA INPUTS CONTROL
  onMfaKeyUp(event: any, index: number) {
    const key = event.key;
    const value = event.target.value;

    if (key === 'Backspace' || key === 'Delete') {
      this.codigoMFAArray[index] = '';
      if (index > 0) {
        const prevInput = document.getElementById(`mfa-digit-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
        }
      }
    } else if (/^[0-9]$/.test(value)) {
      this.codigoMFAArray[index] = value;
      if (index < 5) {
        const nextInput = document.getElementById(`mfa-digit-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }

    this.codigoMFA = this.codigoMFAArray.join('');

    // Si se completaron los 6 dígitos, verificar automáticamente
    if (this.codigoMFA.length === 6) {
      this.verificarMFA();
    }
  }

  onMfaFocus(event: any) {
    event.target.select();
  }
}