import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    loadComponent: () => import('./components/list/list.component').then(m => m.ProjectsListComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.ProjectSettingsComponent)
  },
  {
    path: 'kanban',
    loadComponent: () => import('./components/kanban/kanban.component').then(m => m.ProjectsKanbanComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/form/form.component').then(m => m.ProjectFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/form/form.component').then(m => m.ProjectFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/view/view.component').then(m => m.ProjectViewComponent)
  }
];
