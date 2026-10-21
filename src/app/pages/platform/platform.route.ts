import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent)
  },
  {
    path: 'companies',
    loadComponent: () => import('./companies/platform-companies.component').then(m => m.PlatformCompaniesComponent)
  },
  {
    path: 'leads',
    loadComponent: () => import('./leads/platform-leads.component').then(m => m.PlatformLeadsComponent)
  },
  {
    path: 'finance',
    loadComponent: () => import('./finance/platform-finance.component').then(m => m.PlatformFinanceComponent)
  }
];
