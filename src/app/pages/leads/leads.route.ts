import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () => import('./components/list/list.component').then(m => m.LeadsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/form/form.component').then(m => m.LeadFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/form/form.component').then(m => m.LeadFormComponent)
  },
  {
    path: 'integration',
    loadComponent: () => import('./components/integration/integration.component').then(m => m.LeadIntegrationComponent)
  }
];
