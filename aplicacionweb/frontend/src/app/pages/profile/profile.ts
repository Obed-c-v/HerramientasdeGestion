import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { SecurityValidators } from '../../shared/validators/security.validators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface Notification { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  settingsService = inject(SettingsService);
  authService = inject(AuthService);
  private router = inject(Router);

  profileData = signal<any>(null);
  avatarUrl = signal<string | null>(null);
  notification = signal<Notification | null>(null);
  savingProfile = signal(false);
  savingPassword = signal(false);

  profileForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50), SecurityValidators.noHtml()]],
    apellido: ['', [Validators.required, Validators.maxLength(50), SecurityValidators.noHtml()]],
    email: [{ value: '', disabled: true }],
    numero_licencia: [{ value: '', disabled: true }],
    especialidad: ['', [Validators.maxLength(100), SecurityValidators.noHtml(), SecurityValidators.noNumbers()]],
    telefono: ['', [SecurityValidators.phone()]]
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.apiService.get<any>('/auth/me').subscribe({
      next: (res) => {
        const d = res.details;
        this.profileData.set(d);
        if (d) {
          this.authService.userProfile.set({
            nombre: d.nombre,
            apellido: d.apellido,
            foto_url: d.foto_url
          });
        }
        this.avatarUrl.set(d?.foto_url ? `http://localhost:3000${d.foto_url}` : null);
        this.profileForm.patchValue({
          nombre: d?.nombre || '',
          apellido: d?.apellido || '',
          email: d?.email || '',
          numero_licencia: d?.numero_licencia || '',
          especialidad: d?.especialidad || '',
          telefono: d?.telefono || ''
        });
      },
      error: () => this.showNotification('Error cargando perfil', 'error')
    });
  }

  get initials(): string {
    const d = this.profileData();
    if (!d) return '??';
    const n = (d.nombre || '?')[0].toUpperCase();
    const a = (d.apellido || '?')[0].toUpperCase();
    return `${n}${a}`;
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  saveProfile() {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    const { nombre, apellido, telefono, especialidad } = this.profileForm.value;
    this.apiService.put<any>('/auth/me', { nombre, apellido, telefono, especialidad }).subscribe({
      next: () => {
        const current = this.authService.userProfile();
        this.authService.userProfile.set({
          ...current,
          nombre,
          apellido,
          foto_url: current?.foto_url || null
        });
        
        // Also update local profileData
        const d = this.profileData();
        this.profileData.set({ ...d, nombre, apellido });

        this.showNotification(this.settingsService.translate('profile_updated'), 'success');
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Error al guardar', 'error');
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.apiService.patch<any>('/auth/me/password', { currentPassword, newPassword }).subscribe({
      next: () => {
        this.showNotification(this.settingsService.translate('password_updated'), 'success');
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Contraseña actual incorrecta', 'error');
        this.savingPassword.set(false);
      }
    });
  }

  onSelectPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('foto', file);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<any>('http://localhost:3000/api/auth/me/foto', formData, { headers }).subscribe({
      next: (res) => {
        this.avatarUrl.set(`http://localhost:3000${res.fotoUrl}?t=${Date.now()}`);
        const current = this.authService.userProfile() || { nombre: '?', apellido: '?' };
        this.authService.userProfile.set({
          ...current,
          foto_url: res.fotoUrl
        });
        this.showNotification('Foto actualizada', 'success');
      },
      error: () => this.showNotification('Error al subir la foto', 'error')
    });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 4000);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
