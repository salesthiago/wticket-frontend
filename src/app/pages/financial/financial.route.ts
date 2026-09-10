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
  {
    path: 'receivables/print/:id',
    loadComponent: () => import('./components/receivables/print.component').then(m => m.ReceivablePrintComponent)
  },

  // Configurações do financeiro (dados de recebimento + atalho Integração Itaú)
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/financial-settings.component').then(m => m.FinancialSettingsComponent)
  },

  // Cobrança (boletos gerados via Integração Itaú, amarrados aos títulos)
  {
    path: 'charges',
    loadComponent: () => import('./components/charges/charges.component').then(m => m.FinancialChargesComponent)
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
