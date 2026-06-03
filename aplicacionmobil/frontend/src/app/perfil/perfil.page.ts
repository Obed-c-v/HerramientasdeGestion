import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {

  usuario: any = null;
  cargando = true;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.cargando = true;
    this.error = null;
    this.authService.getMe().subscribe({
      next: (res) => {
        this.usuario = res.details;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar el perfil. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  // Calcula edad a partir de fecha_nacimiento
  get edad(): string {
    if (!this.usuario?.fecha_nacimiento) return '—';
    const hoy = new Date();
    const nac = new Date(this.usuario.fecha_nacimiento);
    let age = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      age--;
    }
    return `${age} años`;
  }

  // Formatea la fecha de nacimiento legible
  get fechaNacimiento(): string {
    if (!this.usuario?.fecha_nacimiento) return '—';
    return new Date(this.usuario.fecha_nacimiento).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  logout() {
    this.authService.logout();
  }
}