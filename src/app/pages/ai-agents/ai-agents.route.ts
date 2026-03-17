import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-agents.layout').then(m => m.AiAgentsLayout)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/form/form.component').then(m => m.AiAgentFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/form/form.component').then(m => m.AiAgentFormComponent)
  },
  {
    path: ':id/chat',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.AiAgentChatComponent)
  }
];
