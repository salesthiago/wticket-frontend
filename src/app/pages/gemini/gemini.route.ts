import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./gemini.component').then(m => m.GeminiConfigComponent)
  }
];
