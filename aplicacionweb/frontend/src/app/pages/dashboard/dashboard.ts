import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fadeInSlide, staggerAnimation } from '../../shared/animations';
import { SettingsService } from '../../shared/services/settings.service';
import { ApiService } from '../../shared/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  animations: [fadeInSlide, staggerAnimation],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  settingsService = inject(SettingsService);
  private apiService = inject(ApiService);
  
  stats = signal<any>(null);
  alerts = signal<any[]>([]);
  isSidebarCollapsed = signal(false);

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.apiService.get<any>('/dashboard').subscribe(stats => this.stats.set(stats));
    this.apiService.get<any[]>('/alertas').subscribe(alerts => this.alerts.set(alerts));
  }

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }
}
