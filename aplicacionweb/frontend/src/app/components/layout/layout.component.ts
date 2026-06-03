import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, ChildrenOutletContexts } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, query, animate, group } from '@angular/animations';
import { Sidebar } from '../sidebar/sidebar';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb';
import { SettingsService, Language } from '../../shared/services/settings.service';
import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, Sidebar, BreadcrumbComponent, FormsModule],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.css'],
    animations: [
        trigger('routeAnimations', [
            transition('* <=> *', [
                style({ position: 'relative' }),
                query(':enter, :leave', [
                    style({ position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, transform: 'translateY(10px)' })
                ], { optional: true }),
                group([
                    query(':leave', [animate('250ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))], { optional: true }),
                    query(':enter', [animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))], { optional: true })
                ])
            ])
        ])
    ]
})
export class LayoutComponent implements OnInit {
    settingsService = inject(SettingsService);
    authService = inject(AuthService);
    apiService = inject(ApiService);
    @ViewChild(Sidebar) sidebar!: Sidebar;

    constructor(private router: Router, private contexts: ChildrenOutletContexts) { }

    ngOnInit() {
        if (this.authService.isLoggedIn()) {
            this.apiService.get<any>('/auth/me').subscribe({
                next: (res) => {
                    const d = res.details;
                    if (d) {
                        this.authService.userProfile.set({
                            nombre: d.nombre,
                            apellido: d.apellido,
                            foto_url: d.foto_url
                        });
                    }
                },
                error: () => console.error('Error fetching layout profile')
            });
        }
    }

    get userFullName(): string {
        const p = this.authService.userProfile();
        return p ? `${p.nombre} ${p.apellido || ''}`.trim() : 'Cargando...';
    }

    get userInitials(): string {
        const p = this.authService.userProfile();
        if (!p) return '--';
        const n = (p.nombre || '?')[0].toUpperCase();
        const a = (p.apellido || '?')[0].toUpperCase();
        return `${n}${a}`;
    }

    get userAvatarUrl(): string | null {
        const url = this.authService.userProfile()?.foto_url;
        return url ? `http://localhost:3000${url}` : null;
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.toggleMobile();
        } else {
            this.sidebar.toggle();
        }
    }

    getRouteAnimationData() {
        return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
    }

    goToProfile() {
        this.router.navigate(['/profile']);
    }

    logout() {
        this.router.navigate(['/login']);
    }

    onLanguageChange(event: any) {
        this.settingsService.setLanguage(event.target.value as Language);
    }
}
