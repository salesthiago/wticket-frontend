import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-providers.component').then(m => m.AiProvidersComponent)
  }
];
