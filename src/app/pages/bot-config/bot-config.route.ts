import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () => import('./components/list/list.component').then(m => m.ListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/form/form.component').then(m => m.BotConfigFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/form/form.component').then(m => m.BotConfigFormComponent)
  }

];
