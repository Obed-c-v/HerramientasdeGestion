import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInSlide } from '../../shared/animations';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  animations: [fadeInSlide],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  settingsService = inject(SettingsService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.maxLength(50)]]
  });

  errorMessage = '';

  onLogin() {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    console.log('Sending login request for email:', email);

    this.apiService.post<any>('/auth/login', { email, password, source: 'web' }).subscribe({
      next: (res) => {
        console.log('Login request succeeded. Response:', res);
        // Extra safety: block patients on the client side too
        if (res.user?.rol === 'PACIENTE') {
          console.warn('Patient role detected on web panel login. Blocking access.');
          this.errorMessage = 'Credenciales incorrectas';
          this.cdr.detectChanges();
          return;
        }

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        // Refresh auth service so role signal is populated before navigation
        this.authService.refresh();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login request failed. Error details:', err);
        this.errorMessage = 'Credenciales incorrectas';
        console.log('errorMessage has been set to:', this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }
}
