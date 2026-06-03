import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { staggerAnimation } from '../../shared/animations';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [staggerAnimation],
  templateUrl: './doctor-patients.html',
  styleUrl: './doctor-patients.css'
})
export class DoctorPatients implements OnInit {
  settingsService = inject(SettingsService);
  private apiService = inject(ApiService);

  selectedDoctor = signal<any>(null);
  doctors = signal<any[]>([]);

  ngOnInit() {
    this.apiService.get<any[]>('/medicos/asignaciones').subscribe(data => {
      this.doctors.set(data.map(d => ({
        ...d,
        patientCount: d.pacientes_count // Mapping backend to frontend
      })));
    });
  }

  selectDoctor(doctor: any) {
    this.apiService.get<any[]>(`/medicos/${doctor.id}/pacientes`).subscribe(patients => {
      const doctorWithPatients = {
        ...doctor,
        patients: patients.map(p => ({
          id: p.paciente_id,
          name: p.paciente_nombre,
          age: p.edad,
          lastTest: p.ultima_prueba ? new Date(p.ultima_prueba).toLocaleDateString() : 'N/A',
          riskLevel: p.riesgo_nivel || 'Bajo'
        }))
      };
      this.selectedDoctor.set(doctorWithPatients);
    });
  }
}
