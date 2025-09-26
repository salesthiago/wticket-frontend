import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

const customPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        formField: {
          hoverBorderColor: '{primary.color}'
        }
      },
      dark: {
        formField: {
          hoverBorderColor: '{primary.color}'
        }
      }
    }
  }
})
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: customPreset,
        options: {
          darkModeSelector: '.dark',
        }
      }
    }),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};



