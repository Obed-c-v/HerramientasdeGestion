import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: false,
})
export class Tab5Page implements OnInit {

  usuario: string = '';
  correo: string = '';
  fotoPerfil: string = 'https://i.pravatar.cc/150?img=12';
  cargando = true;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private authService: AuthService) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.cargando = true;
    this.authService.getMe().subscribe({
      next: (res) => {
        const datos = res.details;
        if (datos) {
          this.usuario = `${datos.nombre || ''} ${datos.apellido || ''}`.trim();
          this.correo = datos.email || '';
        }
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  // abrir selector de imagen
  seleccionarFoto() {
    this.fileInput.nativeElement.click();
  }

  // cargar foto
  cargarFoto(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      this.fotoPerfil = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  }

  // cerrar sesión — usa AuthService para limpiar el token JWT
  logout() {
    this.authService.logout();
  }
}