import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VoiceRecorder } from 'capacitor-voice-recorder';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  isRecording = false;
  audioUrl: string | null = null;
  recordingDuration = 0;
  durationInterval: any;

  // Analysis States
  isAnalyzing = false;
  analysisResult: any = null;

  constructor(private router: Router) {}

  async startRecording() {
    try {

      const permission = await VoiceRecorder.requestAudioRecordingPermission();

      if (!permission.value) {
        alert("Debes permitir el micrófono");
        return;
      }

      await VoiceRecorder.startRecording();

      this.isRecording = true;
      this.recordingDuration = 0;
      this.analysisResult = null;
      this.isAnalyzing = false;

      this.durationInterval = setInterval(() => {
        this.recordingDuration++;
      }, 1000);

    } catch (error) {
      console.error("Error al iniciar grabación", error);
    }
  }

  async stopRecording() {

    try {

      const result = await VoiceRecorder.stopRecording();

      this.isRecording = false;
      clearInterval(this.durationInterval);

      if (result.value && result.value.recordDataBase64) {

        const audioBase64 = result.value.recordDataBase64;

        const audioBlob = this.base64ToBlob(audioBase64, 'audio/mp3');
        this.audioUrl = URL.createObjectURL(audioBlob);

        this.runMockAnalysis();
      }

    } catch (error) {
      console.error("Error al detener grabación", error);
    }

  }

  async cancelRecording() {
    try {
      await VoiceRecorder.stopRecording();
      this.isRecording = false;
      clearInterval(this.durationInterval);
      this.recordingDuration = 0;
      this.audioUrl = null;
    } catch (error) {
      console.error("Error al cancelar grabación", error);
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  base64ToBlob(base64: string, mime: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const hStr = hours < 10 ? '0' + hours : hours;
    const mStr = mins < 10 ? '0' + mins : mins;
    const sStr = secs < 10 ? '0' + secs : secs;
    
    return `${hStr}:${mStr}:${sStr}`;
  }

  runMockAnalysis() {

    this.isAnalyzing = true;

    setTimeout(() => {

      this.isAnalyzing = false;

      const randomOutcome = Math.floor(Math.random() * 3);

      if (randomOutcome === 0) {

        this.analysisResult = {
          status: 'success',
          title: 'Libre de Parkinson',
          description: 'Tu voz se escucha clara y estable. No se detectan patrones vocales asociados a la enfermedad.',
          features: [
            { name: 'Estabilidad de voz', value: 'Normal', icon: 'checkmark-circle', color: 'success' },
            { name: 'Volumen', value: 'Fuerte', icon: 'volume-high', color: 'success' }
          ]
        };

      } else if (randomOutcome === 1) {

        this.analysisResult = {
          status: 'warning',
          title: 'Voz Débil Detectada',
          description: 'Se detectó cierta debilidad en la voz.',
          features: [
            { name: 'Estabilidad de voz', value: 'Inestable', icon: 'warning', color: 'warning' },
            { name: 'Volumen', value: 'Débil', icon: 'volume-low', color: 'warning' }
          ]
        };

      } else {

        this.analysisResult = {
          status: 'danger',
          title: 'Síntomas Posibles',
          description: 'Se detectó voz temblorosa y debilidad.',
          features: [
            { name: 'Voz', value: 'Temblorosa', icon: 'pulse', color: 'danger' },
            { name: 'Volumen', value: 'Muy Débil', icon: 'volume-mute', color: 'danger' }
          ]
        };

      }

      // Hide the result card from tab 1 if we are navigating
      // Navigate to tab 4
      this.router.navigate(['/tabs/tab4'], { state: { analysisResult: this.analysisResult } });

    }, 2000);

  }

}