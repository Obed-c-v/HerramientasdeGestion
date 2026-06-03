import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { staggerAnimation } from '../../shared/animations';
import { SettingsService } from '../../shared/services/settings.service';
import { SecurityValidators } from '../../shared/validators/security.validators';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [staggerAnimation],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css'
})
export class Doctors implements OnInit {
  private fb = inject(FormBuilder);
  settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  
  searchTermControl = new FormControl('');
  specialtyControl = new FormControl('');
  
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  formSubmitted = false;

  doctorsList = signal<any[]>([]);
  notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

  doctorForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50), SecurityValidators.noHtml(), SecurityValidators.noNumbers()]],
    apellido: ['', [Validators.required, Validators.maxLength(50), SecurityValidators.noHtml(), SecurityValidators.noNumbers()]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
    especialidad: ['Medicina General', [Validators.required, SecurityValidators.noNumbers()]],
    numero_licencia: ['', [Validators.required, Validators.maxLength(50), SecurityValidators.noHtml()]],
    telefono: ['', [SecurityValidators.phone()]],
    activo: [true, [Validators.required]]
  });

  specialtes = ['Cardiología', 'Neurología', 'Medicina General', 'Pediatría', 'Geriatría'];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  ngOnInit() {
    console.log('DEBUG: Doctors component initialized');
    this.fetchData();
    
    // Debug form status
    this.doctorForm.statusChanges.subscribe(status => {
      console.log('DEBUG: Doctor Form Status:', status);
      if (status === 'INVALID') {
        Object.keys(this.doctorForm.controls).forEach(key => {
          const controlErrors = this.doctorForm.get(key)?.errors;
          if (controlErrors != null) {
            console.log('DEBUG: Control:', key, 'Errors:', controlErrors);
          }
        });
      }
    });
    
    // Search functionality
    this.searchTermControl.valueChanges.subscribe(() => {
      this.fetchData();
    });
    this.specialtyControl.valueChanges.subscribe(() => {
      this.fetchData();
    });
  }

  fetchData() {
    const params = {
      nombre: this.searchTermControl.value || '',
      especialidad: this.specialtyControl.value || ''
    };
    
    this.apiService.get<any[]>('/medicos', params).subscribe(data => {
      this.doctorsList.set(data);
    });
  }

  get filteredDoctors() {
    return this.doctorsList();
  }

  get totalPages() { return Math.ceil(this.filteredDoctors.length / this.pageSize); }
  get paginatedDoctors() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredDoctors.slice(startIndex, startIndex + this.pageSize);
  }
  get pageNumbers() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  goToPage(page: number) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  toggleStatus(doctor: any) {
    const newStatus = !doctor.activo;
    this.apiService.patch<any>(`/medicos/${doctor.id}/estado`, { activo: newStatus }).subscribe(() => {
      doctor.activo = newStatus;
    });
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.doctorForm.reset({ especialidad: 'Medicina General', activo: true });
    this.showModal = true;
  }

  editDoctor(doctor: any) {
    console.log('DEBUG: editDoctor() called for:', doctor);
    this.isEditing = true;
    this.editingId = doctor.id;
    this.doctorForm.patchValue({
      nombre: doctor.nombre,
      apellido: doctor.apellido,
      email: doctor.email || '',
      especialidad: doctor.especialidad,
      numero_licencia: doctor.numero_licencia,
      telefono: doctor.telefono,
      activo: doctor.activo
    });
    // Remove email and password requirements during edit since fields are hidden
    this.doctorForm.get('email')?.clearValidators();
    this.doctorForm.get('email')?.updateValueAndValidity();
    this.doctorForm.get('password')?.clearValidators();
    this.doctorForm.get('password')?.updateValueAndValidity();
    
    this.showModal = true;
  }

  deleteDoctor(id: number) {
    const confirmMsg = this.settingsService.language() === 'es'
      ? '¿Estás seguro de que deseas eliminar este médico?'
      : 'Are you sure you want to delete this doctor?';

    if (confirm(confirmMsg)) {
      this.apiService.delete(`/medicos/${id}`).subscribe({
        next: () => {
          this.showNotification('Médico eliminado correctamente', 'success');
          this.fetchData();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Error al eliminar médico', 'error');
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.formSubmitted = false;
    this.isEditing = false;
    this.editingId = null;
    this.doctorForm.reset({ especialidad: 'Medicina General', activo: true });
    // Restore validators
    this.doctorForm.get('email')?.setValidators([Validators.required, Validators.email, Validators.maxLength(100)]);
    this.doctorForm.get('email')?.updateValueAndValidity();
    this.doctorForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(50)]);
    this.doctorForm.get('password')?.updateValueAndValidity();
  }

  saveDoctor() {
    console.log('DEBUG: saveDoctor() called');
    this.formSubmitted = true;
    console.log('DEBUG: Doctor Form valid:', this.doctorForm.valid);
    console.log('DEBUG: Is Editing:', this.isEditing, 'Editing ID:', this.editingId);
    
    if (this.doctorForm.invalid) {
      Object.keys(this.doctorForm.controls).forEach(key => {
        const controlErrors = this.doctorForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Doctor Key:', key, 'Errors:', controlErrors);
        }
      });
      this.doctorForm.markAllAsTouched();
      return;
    }

    const data = this.doctorForm.value;

    if (this.isEditing && this.editingId) {
      console.log('DEBUG: Sending PATCH to /medicos/' + this.editingId, data);
      // PATCH /api/medicos/:id
      this.apiService.patch(`/medicos/${this.editingId}`, data).subscribe({
        next: (res) => {
          console.log('DEBUG: PATCH Medico response:', res);
          this.showNotification('Médico actualizado correctamente', 'success');
          this.fetchData();
          this.closeModal();
        },
        error: (err) => {
          console.error('DEBUG: PATCH Medico error:', err);
          this.showNotification(err.error?.message || 'Error al actualizar médico', 'error');
        }
      });
    } else {
      // POST /api/auth/register (Implemented for doctor creation)
      this.apiService.post('/auth/register', data).subscribe({
        next: () => {
          this.showNotification('Médico registrado correctamente', 'success');
          this.fetchData();
          this.closeModal();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Error al registrar médico', 'error');
        }
      });
    }
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notification.set({ message, type });
    setTimeout(() => {
      this.notification.set(null);
    }, 4000);
  }
}
