import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../shared/services/settings.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  settingsService = inject(SettingsService);
  authService = inject(AuthService);
  isCollapsed = signal(false);
  isMobileOpen = signal(false);

  toggle() {
    this.isCollapsed.set(!this.isCollapsed());
  }

  toggleMobile() {
    this.isMobileOpen.set(!this.isMobileOpen());
  }
}
