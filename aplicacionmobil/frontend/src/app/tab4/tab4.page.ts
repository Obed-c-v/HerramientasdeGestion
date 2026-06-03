import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {

  // Resultado dinámico obtenido del análisis en Tab 1
  analysisResult: any = null;

  constructor() { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    // Recuperar el resultado si viene desde la redirección del Tab 1
    if (history.state && history.state.analysisResult) {
      this.analysisResult = history.state.analysisResult;
      
      // Limpiar el estado del historial del Router para evitar que se muestre 
      // indefinidamente al cambiar de pestañas después
      history.replaceState(null, '');
    }
  }

  // Método interactivo para archivar y ocultar el banner temporal de análisis
  archivarAnalisis() {
    this.analysisResult = null;
  }
}
