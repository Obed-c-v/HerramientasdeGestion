import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'spark_auth_token';
  
  public isAuthenticated$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  verifyCode(email: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-code`, { email, codigo });
  }

  changeInitialPassword(email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-initial-password`, { email, newPassword }).pipe(
      tap((res: any) => {
        if (res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  resendCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-code`, { email });
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  getMedicos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medicos`);
  }

  getCitas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/citas`);
  }

  createCita(medicoId: number, fechaHora: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas`, { medico_id: medicoId, fecha_hora: fechaHora });
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticated$.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('sesionActiva');
    this.isAuthenticated$.next(false);
    this.router.navigate(['/login']);
  }
}
