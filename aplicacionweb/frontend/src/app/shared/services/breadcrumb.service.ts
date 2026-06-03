import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRouteSnapshot, Data } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

export interface Breadcrumb {
    label: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class BreadcrumbService {
    private _breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);
    breadcrumbs$ = this._breadcrumbs$.asObservable();

    constructor(private router: Router) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            const root = this.router.routerState.snapshot.root;
            const breadcrumbs: Breadcrumb[] = [];
            this.addBreadcrumb(root, [], breadcrumbs);
            this._breadcrumbs$.next(breadcrumbs);
        });
    }

    private addBreadcrumb(route: ActivatedRouteSnapshot, parentUrl: string[], breadcrumbs: Breadcrumb[]) {
        if (route) {
            const routeUrl = parentUrl.concat(route.url.map(url => url.path));

            if (route.data['breadcrumb']) {
                const label = route.data['breadcrumb'];
                const url = '/' + routeUrl.join('/');

                // Evitar duplicados consecutivos de la misma etiqueta
                const isDuplicate = breadcrumbs.length > 0 &&
                    breadcrumbs[breadcrumbs.length - 1].label === label;

                if (!isDuplicate) {
                    breadcrumbs.push({ label, url });
                }
            }

            this.addBreadcrumb(route.firstChild!, routeUrl, breadcrumbs);
        }
    }
}
