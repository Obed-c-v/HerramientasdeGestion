import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { staggerAnimation } from '../../shared/animations';
import { SettingsService } from '../../shared/services/settings.service';
import { CommonModule } from '@angular/common';
import { SecurityValidators } from '../../shared/validators/security.validators';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  animations: [staggerAnimation],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients implements OnInit {
  private fb = inject(FormBuilder);
  settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  
  searchTermControl = new FormControl('');
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  formSubmitted = false;

  patientsList = signal<any[]>([]);
  medicosList = signal<any[]>([]);
  notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

  patientForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100), SecurityValidators.noHtml(), SecurityValidators.noNumbers()]],
    lastName: ['', [Validators.required, Validators.maxLength(100), SecurityValidators.noHtml(), SecurityValidators.noNumbers()]],
    age: [null as number | null, [Validators.min(0), Validators.max(120), SecurityValidators.onlyNumbers()]],
    gender: ['Masculino', [Validators.required]],
    phone: ['', [SecurityValidators.phone()]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    initialDiagnosis: ['', [Validators.maxLength(500), SecurityValidators.noHtml()]],
    medico_id: [null]
  });

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;

  ngOnInit() {
    this.fetchData();
    if (this.authService.isAdmin()) {
      this.patientForm.get('medico_id')?.setValidators(Validators.required);
      this.fetchMedicos();
    }
    this.searchTermControl.valueChanges.subscribe(() => {
      this.currentPage = 1;
    });
  }

  fetchMedicos() {
    this.apiService.get<any[]>('/medicos').subscribe(data => {
      this.medicosList.set(data);
    });
  }

  fetchData() {
    this.apiService.get<any[]>('/pacientes').subscribe(data => {
      this.patientsList.set(data.map(p => ({
        ...p,
        id: p.id,
        name: `${p.nombre} ${p.apellido}`,
        age: p.fecha_nacimiento ? this.calculateAge(p.fecha_nacimiento) : 0,
        lastTest: p.ultima_prueba ? new Date(p.ultima_prueba).toLocaleDateString() : '-',
        riskLevel: p.riesgo_nivel || 'Pendiente',
        riskClass: this.getRiskClass(p.riesgo_nivel)
      })));
    });
  }

  calculateAge(birthday: string) {
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  getRiskClass(level: string) {
    if (!level) return 'badge-medium';
    const l = level.toLowerCase();
    if (l === 'alto' || l === 'alta') return 'badge-high';
    if (l === 'medio') return 'badge-medium';
    return 'badge-low';
  }

  get filteredPatients() {
    const term = (this.searchTermControl.value || '').toLowerCase();
    return this.patientsList().filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
  }

  get totalPages() { return Math.ceil(this.filteredPatients.length / this.pageSize); }
  get paginatedPatients() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(startIndex, startIndex + this.pageSize);
  }
  get pageNumbers() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  goToPage(page: number) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.patientForm.reset({ gender: 'Masculino' });
    this.showModal = true;
  }

  editPatient(patient: any) {
    this.isEditing = true;
    this.editingId = patient.id;
    this.patientForm.patchValue({
      firstName: patient.nombre,
      lastName: patient.apellido,
      age: patient.age,
      gender: patient.sexo === 'M' ? 'Masculino' : 'Femenino',
      phone: patient.telefono,
      email: patient.email,
      initialDiagnosis: patient.diagnostico_inicial || ''
    });
    // Remove email requirement during edit since fields are hidden
    this.patientForm.get('email')?.clearValidators();
    this.patientForm.get('email')?.updateValueAndValidity();
    
    this.showModal = true;
  }

  deletePatient(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este paciente? (Esta acción eliminará su expediente y registros clínicos)')) {
      this.apiService.delete(`/pacientes/${id}`).subscribe({
        next: () => {
          this.showNotification('Paciente eliminado correctamente', 'success');
          this.fetchData();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Error al eliminar paciente', 'error');
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.formSubmitted = false;
    this.isEditing = false;
    this.editingId = null;
    this.patientForm.reset({ gender: 'Masculino' });
    // Restore validators
    this.patientForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.patientForm.get('email')?.updateValueAndValidity();
  }

  savePatient() {
    this.formSubmitted = true;
    console.log('Form valid:', this.patientForm.valid);
    console.log('Form values:', this.patientForm.value);
    
    if (this.patientForm.invalid) {
      console.log('Form errors:', this.patientForm.errors);
      // Log individual control errors
      Object.keys(this.patientForm.controls).forEach(key => {
        const controlErrors = this.patientForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Key:', key, 'Errors:', controlErrors);
        }
      });
      this.patientForm.markAllAsTouched();
      return;
    }

    const form = this.patientForm.value;
    const body = {
      email: form.email,
      nombre: form.firstName,
      apellido: form.lastName,
      fecha_nacimiento: new Date(new Date().getFullYear() - form.age, 0, 1).toISOString().split('T')[0], // Rough estimate
      sexo: form.gender === 'Masculino' ? 'M' : 'F',
      telefono: form.phone,
      diagnostico_inicial: form.initialDiagnosis,
      medico_id: form.medico_id
    };

    if (this.isEditing && this.editingId) {
       console.log('Sending PATCH to /pacientes/' + this.editingId, body);
       // PATCH /api/pacientes/:id
       this.apiService.patch(`/pacientes/${this.editingId}`, body).subscribe({
         next: (res) => {
           console.log('PATCH response:', res);
           this.showNotification('Paciente actualizado correctamente', 'success');
           this.fetchData();
           this.closeModal();
         },
         error: (err) => {
           console.error('PATCH error:', err);
           this.showNotification(err.error?.message || 'Error al actualizar paciente', 'error');
         }
       });
    } else {
      this.apiService.post('/pacientes', body).subscribe({
        next: () => {
          this.showNotification('Paciente registrado correctamente', 'success');
          this.fetchData();
          this.closeModal();
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Error al registrar paciente', 'error');
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
