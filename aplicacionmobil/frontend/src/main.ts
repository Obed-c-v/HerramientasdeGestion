import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// 🔥 Custom import para Firebase Global
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';
import { SocialLogin } from '@capgo/capacitor-social-login';

// Inicializar Firebase a nivel global
initializeApp(environment.firebaseConfig);

// Inicializar Social Login
SocialLogin.initialize({
  google: {
    webClientId: environment.googleWebClientId,
  },
});

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
