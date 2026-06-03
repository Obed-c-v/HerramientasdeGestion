import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService, Language } from '../../shared/services/settings.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private fb = inject(FormBuilder);
  settingsService = inject(SettingsService);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    console.log('Changing password...');
    alert(this.settingsService.language() === 'es' 
      ? 'Contraseña actualizada con éxito.' 
      : 'Password updated successfully.');
    this.passwordForm.reset();
  }

  onLanguageChange(event: any) {
    this.settingsService.setLanguage(event.target.value as Language);
  }
}
