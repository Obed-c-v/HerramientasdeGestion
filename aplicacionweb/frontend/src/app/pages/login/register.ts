import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { fadeInSlide } from '../../shared/animations';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  animations: [fadeInSlide],
  templateUrl: './register.html',
  styleUrl: './login.css', // Reutilizamos estilos de login
})
export class Register {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  settingsService = inject(SettingsService);

  registerForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellido: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
    especialidad: ['', [Validators.required, Validators.maxLength(100)]],
    numero_licencia: ['', [Validators.required, Validators.maxLength(50)]],
    telefono: ['', [Validators.maxLength(20)]]
  });

  errorMessage = '';
  successMessage = '';

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.apiService.post<any>('/auth/register', this.registerForm.value).subscribe({
      next: () => {
        this.successMessage = 'Registro exitoso. Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al registrar médico';
      }
    });
  }
}
