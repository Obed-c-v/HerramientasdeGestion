import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { staggerAnimation } from '../../shared/animations';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [RouterLink, CommonModule],
  animations: [staggerAnimation],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  public settingsService = inject(SettingsService);
  private apiService = inject(ApiService);

  alerts = signal<any[]>([]);
  filterLevels = ['Todas', 'Alta', 'Media', 'Baja'];
  selectedLevel = signal('Todas');

  ngOnInit() {
    this.apiService.get<any[]>('/alertas').subscribe(data => {
      this.alerts.set(data.map((alert, index) => ({
        id: `P-${1000 + index}`, // Placeholder ID as backend doesn't provide it in alerts
        name: alert.paciente,
        date: new Date(alert.ultima_prueba).toLocaleDateString(),
        time: new Date(alert.ultima_prueba).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        level: alert.riesgo.charAt(0) + alert.riesgo.slice(1).toLowerCase(),
        levelClass: alert.riesgo.toLowerCase() === 'alto' ? 'high' : (alert.riesgo.toLowerCase() === 'medio' ? 'medium' : 'low'),
        reason: alert.mensaje,
        status: alert.tiene_cita ? 'Cita programada' : 'Pendiente'
      })));
    });
  }

  get filteredAlerts() {
    if (this.selectedLevel() === 'Todas') {
      return this.alerts();
    }
    return this.alerts().filter(alert => alert.level === this.selectedLevel());
  }

  setFilter(level: string) {
    this.selectedLevel.set(level);
  }

  onPatientClick(id: string) {
    console.log('Ver paciente:', id);
  }
}
