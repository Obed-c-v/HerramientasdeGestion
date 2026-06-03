import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../shared/services/settings.service';
import { SecurityValidators } from '../../shared/validators/security.validators';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
})
export class PatientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  
  patientId = this.route.snapshot.paramMap.get('id');

  patientData = signal<any>(null);
  isAddingNote = false;
  
  noteForm: FormGroup = this.fb.group({
    tipo: ['SEGUIMIENTO', [Validators.required]],
    contenido: ['', [Validators.required, Validators.maxLength(500), SecurityValidators.noHtml()]]
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    if (this.patientId) {
      this.apiService.get<any>(`/pacientes/${this.patientId}/detalle`).subscribe(data => {
        // Transform backend data to frontend structure
        const lastBiomarkers = data.registros_biomarcador?.[0];
        const riskLevel = lastBiomarkers?.resultado_ia?.riesgo || 'Bajo';
        
        this.patientData.set({
          id: data.paciente.id,
          expedienteId: data.expediente.id, // ✅ guardar el expediente_id real
          name: `${data.paciente.nombre} ${data.paciente.apellido}`,
          age: this.calculateAge(data.paciente.fecha_nacimiento),
          gender: data.paciente.sexo === 'M' ? 'Masculino' : 'Femenino',
          diagnosisDate: data.expediente.fecha_apertura,
          currentStage: 'N/A',
          riskLevel: riskLevel,
          riskClass: this.getRiskClass(riskLevel),
          interpretation: lastBiomarkers?.resultado_ia?.interpretacion || '',
          notes: data.notas_clinicas || [],
          history: data.registros_biomarcador.map((r: any) => ({
             date: new Date(r.fecha_registro).toLocaleDateString(),
             result: r.resultado_ia?.riesgo || 'Estable',
             jitter: r.nombre === 'Jitter' ? `${r.valor}%` : '-',
             shimmer: r.nombre === 'Shimmer' ? `${r.valor}%` : '-',
             hnr: r.nombre === 'HNR' ? `${r.valor} dB` : '-'
          }))
        });
      });
    }
  }

  calculateAge(birthday: string) {
    if (!birthday) return 0;
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  getRiskClass(level: string) {
    if (!level) return 'low';
    const l = level.toLowerCase();
    if (l === 'alto' || l === 'alta') return 'high';
    if (l === 'medio') return 'medium';
    return 'low';
  }

  get initialDiagnosis() {
    return this.patientData()?.notes.find((n: any) => n.tipo === 'INICIAL');
  }

  get otherNotes() {
    return (this.patientData()?.notes || [])
      .filter((n: any) => n.tipo !== 'INICIAL')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  toggleAddNote() {
    this.isAddingNote = !this.isAddingNote;
    if (this.isAddingNote) {
      this.noteForm.reset({ tipo: 'SEGUIMIENTO', contenido: '' });
    }
  }

  saveNote() {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const { tipo, contenido } = this.noteForm.value;

    this.apiService.post('/notas', { 
      expediente_id: this.patientData().expedienteId, // ✅ usar el expediente_id real
      tipo,
      contenido
    }).subscribe({
      next: () => {
        this.fetchData();
        this.toggleAddNote();
      },
      error: (err) => {
        console.error('Error al guardar nota:', err);
      }
    });
  }
}
