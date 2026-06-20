import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () => import('./components/list/list.component').then(m => m.TicketsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.TicketSettingsComponent)
  },
  {
    path: ':id/attend',
    loadComponent: () => import('./components/attend/attend.component').then(m => m.TicketAttendComponent)
  }
];
