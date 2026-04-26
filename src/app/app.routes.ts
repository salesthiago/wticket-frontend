import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth-guard';
import { moduleGuard, superAdminGuard } from './guards/module-guard';
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
    path: 'my-company',
    loadComponent: () => import('./pages/my-company/my-company.component').then(m => m.MyCompanyComponent),
    canActivate: [authGuard]
  },
  // Super-admin
  {
    path: 'admin/companies',
    loadComponent: () => import('./pages/admin/companies/companies-list.component').then(m => m.CompaniesListComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  {
    path: 'admin/companies/:id',
    loadComponent: () => import('./pages/admin/companies/company-detail.component').then(m => m.CompanyDetailComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  {
    path: 'admin/modules',
    loadComponent: () => import('./pages/admin/modules/modules-list.component').then(m => m.ModulesListComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  // Tenant + module-gated routes
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.route').then(m => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'contacts',
    loadChildren: () => import('./pages/contacts/contact.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'whatsapp',
    loadChildren: () => import('./pages/whatsapp/whatsapp.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'tickets',
    loadChildren: () => import('./pages/tickets/ticket.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'appointments',
    loadChildren: () => import('./pages/appointments/appointments.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'bot-config',
    loadChildren: () => import('./pages/bot-config/bot-config.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance')]
  },
  {
    path: 'ai-agents',
    loadChildren: () => import('./pages/ai-agents/ai-agents.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance')]
  },
  {
    path: 'ai-providers',
    loadChildren: () => import('./pages/ai-providers/ai-providers.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance')]
  },
  {
    path: 'products',
    loadChildren: () => import('./pages/products/products.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order')]
  },
  {
    path: 'customers',
    loadChildren: () => import('./pages/customers/customers.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order')]
  },
  {
    path: 'service-orders',
    loadChildren: () => import('./pages/service-orders/service-orders.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order')]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
