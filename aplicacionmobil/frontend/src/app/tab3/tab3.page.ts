import { Component, OnInit } from '@angular/core';

interface Routine {
  title: string;
  subtitle: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  duration: string;
  hint: string;
  target: string;
  steps: string[];
  precautions: string;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {

  // Dashboard de bienestar
  rachaDias: number = 3;
  puntosBienestar: number = 210;
  
  // Categoría de ejercicios activa
  categoriaActiva: 'cervical' | 'hombros' | 'manos' = 'cervical';

  // Progreso de la rutina de hoy
  seriesCompleted: number = 1;
  maxSeries: number = 3;
  rutinaCompletada: boolean = false;
  mostrarFelicitaciones: boolean = false;

  // Catálogo de rutinas suaves para Parkinson / Rigidez
  rutinas: Record<'cervical' | 'hombros' | 'manos', Routine> = {
    cervical: {
      title: 'Círculos suaves de cuello sentad@',
      subtitle: 'Movilidad cervical suave · Alivia rigidez en cuello',
      difficulty: 'Básico',
      duration: '5 min',
      hint: 'Movimiento lento, sin dolor',
      target: 'Aflojar suavemente la musculatura del cuello y mejorar la movilidad cervical sin forzar.',
      steps: [
        'Siéntate con la espalda apoyada firmemente y los pies planos en el suelo.',
        'Lleva la barbilla hacia el pecho lentamente y respira profundo.',
        'Despacio, dibuja un medio círculo llevando la cabeza hacia tu hombro izquierdo y luego de regreso hacia el derecho.',
        'Mantén un ritmo pausado y respira tranquilo mientras te mueves.',
        'Haz una pausa de 10 segundos al finalizar cada serie antes de continuar.'
      ],
      precautions: 'Si aparece dolor, mareo o visión borrosa, detén el ejercicio inmediatamente. No hagas giros de 360 grados ni tirones bruscos.'
    },
    hombros: {
      title: 'Elevación y rotación suave de hombros',
      subtitle: 'Movilidad de hombros · Reduce rigidez superior',
      difficulty: 'Básico',
      duration: '6 min',
      hint: 'Hombros relajados, ritmo pausado',
      target: 'Liberar tensión acumulada en la articulación del hombro y la parte superior de la espalda.',
      steps: [
        'Colócate erguido en una silla cómoda con los brazos relajados a los lados.',
        'Inhala aire y sube ambos hombros de forma controlada hacia tus orejas.',
        'Exhala suavemente mientras llevas los hombros hacia atrás y abajo en un movimiento circular.',
        'Mantén el cuello recto y evita tensar la mandíbula al subir.',
        'Realiza de 5 a 8 giros suaves por cada serie.'
      ],
      precautions: 'Evita movimientos rápidos o forzar el rango de movimiento si sientes pinchazos o molestias agudas en el manguito rotador.'
    },
    manos: {
      title: 'Apertura y cierre de manos con toques de dedos',
      subtitle: 'Coordinación fina · Agilidad en dedos',
      difficulty: 'Intermedio',
      duration: '4 min',
      hint: 'Movimiento fluido y muy consciente',
      target: 'Estimular la circulación, la motricidad fina y disminuir la rigidez en manos y dedos.',
      steps: [
        'Extiende ambos brazos al frente a la altura de tu pecho con las palmas abiertas.',
        'Separa los dedos lo más posible sintiendo un estiramiento agradable y sostén por 3 segundos.',
        'Cierra los puños suavemente, abrazando el pulgar sin apretar con demasiada fuerza.',
        'Abre las manos nuevamente y toca consecutivamente la yema de cada dedo con la yema del pulgar.',
        'Alterna el orden de los toques para desafiar la coordinación cerebral.'
      ],
      precautions: 'Si sientes fatiga muscular en los antebrazos, haz pausas más prolongadas. No forces las articulaciones si hay dolor.'
    }
  };

  constructor() {}

  ngOnInit() {
    // Inicialización si fuera requerida
  }

  // Cambiar categoría y cargar la rutina respectiva
  seleccionarCategoria(cat: 'cervical' | 'hombros' | 'manos') {
    this.categoriaActiva = cat;
    // Reiniciar progreso de la rutina al cambiar de categoría
    this.seriesCompleted = 0;
    this.rutinaCompletada = false;
    this.mostrarFelicitaciones = false;
  }

  // Registrar una serie de ejercicio como completada
  completarSerie() {
    if (this.seriesCompleted < this.maxSeries) {
      this.seriesCompleted++;
      
      // Si se completaron todas las series
      if (this.seriesCompleted === this.maxSeries) {
        this.rutinaCompletada = true;
        this.mostrarFelicitaciones = true;
        
        // Sumar puntos de bienestar y aumentar racha
        this.puntosBienestar += 70;
        this.rachaDias += 1;
        
        // Ocultar modal de felicitaciones automáticamente tras 5 segundos
        setTimeout(() => {
          this.mostrarFelicitaciones = false;
        }, 5000);
      }
    }
  }

  // Obtener la rutina activa actual
  get rutinaActual(): Routine {
    return this.rutinas[this.categoriaActiva];
  }

  // Cerrar alerta de felicitación
  cerrarFelicitacion() {
    this.mostrarFelicitaciones = false;
  }

  // Reiniciar la rutina para practicar de nuevo
  reiniciarRutina() {
    this.seriesCompleted = 0;
    this.rutinaCompletada = false;
    this.mostrarFelicitaciones = false;
  }
}
