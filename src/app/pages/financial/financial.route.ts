import { Routes } from '@angular/router';
import { moduleGuard } from '../../guards/module-guard';

// Os componentes reais serão criados nas próximas fases (C, D).
// Por enquanto todas as rotas apontam para o placeholder.
const placeholder = () =>
  import('./components/placeholder/placeholder.component').then(m => m.FinancialPlaceholderComponent);

export const routes: Routes = [
  { path: '', redirectTo: 'receivables', pathMatch: 'full' },

  // Dashboard (Fase D)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.FinancialDashboardComponent)
  },

  // Contas a Receber (Fase C)
  {
    path: 'receivables',
    loadComponent: () => import('./components/receivables/list.component').then(m => m.ReceivablesListComponent)
  },
  {
    path: 'receivables/create',
    loadComponent: () => import('./components/receivables/form.component').then(m => m.ReceivableFormComponent)
  },
  {
    path: 'receivables/edit/:id',
    loadComponent: () => import('./components/receivables/form.component').then(m => m.ReceivableFormComponent)
  },
  {
    path: 'receivables/view/:id',
    loadComponent: () => import('./components/receivables/view.component').then(m => m.ReceivableViewComponent)
  },

  // Integração Itaú (módulo itau_integration)
  {
    path: 'itau/config',
    canActivate: [moduleGuard('itau_integration')],
    loadComponent: () => import('./components/itau/config/itau-config.component').then(m => m.ItauConfigComponent)
  },
  {
    path: 'itau/history',
    canActivate: [moduleGuard('itau_integration')],
    loadComponent: () => import('./components/itau/history/itau-history.component').then(m => m.ItauHistoryComponent)
  }
];
