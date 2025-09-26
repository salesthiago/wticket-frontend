import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () => import('./components/list/list.component').then(m => m.ListComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/form/form.component').then(m => m.FormComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/form/form.component').then(m => m.FormComponent)
  }

];
