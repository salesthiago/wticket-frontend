import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth-guard';
import { RegisterComponent } from './pages/register/register.component';
import { MyAccountComponent } from './pages/my-account/my-account.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'my-account',
    component: MyAccountComponent,
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'contacts',
    loadChildren: () => import('./pages/contacts/contact.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'whatsapp',
    loadChildren: () => import('./pages/whatsapp/whatsapp.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'tickets',
    loadChildren: () => import('./pages/tickets/ticket.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'bot-config',
    loadChildren: () => import('./pages/bot-config/bot-config.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'appointments',
    loadChildren: () => import('./pages/appointments/appointments.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'gemini',
    loadChildren: () => import('./pages/gemini/gemini.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    loadChildren: () => import('./pages/products/products.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    loadChildren: () => import('./pages/customers/customers.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'ai-agents',
    loadChildren: () => import('./pages/ai-agents/ai-agents.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'ai-providers',
    loadChildren: () => import('./pages/ai-providers/ai-providers.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
