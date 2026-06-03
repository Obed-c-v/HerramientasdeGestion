import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService, Breadcrumb } from '../../shared/services/breadcrumb.service';
import { SettingsService } from '../../shared/services/settings.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './breadcrumb.html',
    styleUrl: './breadcrumb.css',
})
export class BreadcrumbComponent {
    breadcrumbs$: Observable<Breadcrumb[]>;
    settingsService = inject(SettingsService);

    constructor(private breadcrumbService: BreadcrumbService) {
        this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
    }
}
