import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'issuances', pathMatch: 'full' },

  // Configuração (Fase B)
  {
    path: 'config',
    loadComponent: () => import('./components/config/config.component').then(m => m.ConfigComponent)
  },

  // Catálogo de códigos de serviço (Fase C)
  {
    path: 'service-codes',
    loadComponent: () => import('./components/service-codes/list.component').then(m => m.ServiceCodesListComponent)
  },
  {
    path: 'service-codes/create',
    loadComponent: () => import('./components/service-codes/form.component').then(m => m.ServiceCodeFormComponent)
  },
  {
    path: 'service-codes/edit/:id',
    loadComponent: () => import('./components/service-codes/form.component').then(m => m.ServiceCodeFormComponent)
  },

  // Emissões (Fase D)
  {
    path: 'issuances',
    loadComponent: () => import('./components/issuance/list.component').then(m => m.IssuanceListComponent)
  },
  {
    path: 'issuances/create',
    loadComponent: () => import('./components/issuance/form.component').then(m => m.IssuanceFormComponent)
  },
  {
    path: 'issuances/view/:id',
    loadComponent: () => import('./components/issuance/view.component').then(m => m.IssuanceViewComponent)
  }
];
