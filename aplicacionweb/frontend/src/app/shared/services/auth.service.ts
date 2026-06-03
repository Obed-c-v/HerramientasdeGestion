import { Injectable, signal, computed } from '@angular/core';

export interface UserSession {
  user_id: number;
  rol: string;
  medico_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _session = signal<UserSession | null>(this._loadSession());
  public userProfile = signal<{ nombre: string, apellido: string, foto_url: string | null } | null>(null);

  // Computed signals for convenience
  readonly role = computed(() => this._session()?.rol ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly isAdmin = computed(() => this._session()?.rol === 'ADMIN');
  readonly isMedico = computed(() => this._session()?.rol === 'MEDICO');

  private _loadSession(): UserSession | null {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      // Decode the JWT payload (middle part)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        user_id: decoded.user_id,
        rol: decoded.rol,
        medico_id: decoded.medico_id ?? null
      };
    } catch {
      return null;
    }
  }

  /** Call after a successful login to refresh session data from the new token */
  refresh(): void {
    this._session.set(this._loadSession());
  }

  /** Clear session and token from storage */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._session.set(null);
  }
}
