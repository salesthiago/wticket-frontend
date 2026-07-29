import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth-guard';
import { moduleGuard, superAdminGuard, notCustomerScopeGuard } from './guards/module-guard';
import { roleGuard } from './guards/role-guard';
import { RegisterComponent } from './pages/register/register.component';
import { MyAccountComponent } from './pages/my-account/my-account.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, notCustomerScopeGuard]
  },
  {
    path: 'my-account',
    component: MyAccountComponent,
    canActivate: [authGuard]
  },
  {
    path: 'my-company',
    loadComponent: () => import('./pages/my-company/my-company.component').then(m => m.MyCompanyComponent),
    canActivate: [authGuard, notCustomerScopeGuard]
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
  {
    path: 'admin/plans',
    loadComponent: () => import('./pages/admin/plans/plans-list.component').then(m => m.PlansListComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  {
    path: 'admin/email-config',
    loadComponent: () => import('./pages/admin/email-config/email-config.component').then(m => m.EmailConfigComponent),
    canActivate: [authGuard, superAdminGuard]
  },
  // Tenant + module-gated routes
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.route').then(m => m.routes),
    canActivate: [authGuard, notCustomerScopeGuard]
  },
  {
    path: 'contacts',
    loadChildren: () => import('./pages/contacts/contact.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance'), notCustomerScopeGuard]
  },
  {
    path: 'whatsapp',
    loadChildren: () => import('./pages/whatsapp/whatsapp.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance'), notCustomerScopeGuard]
  },
  {
    path: 'tickets',
    loadChildren: () => import('./pages/tickets/ticket.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'projects',
    loadChildren: () => import('./pages/projects/project.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance')]
  },
  {
    path: 'appointments',
    loadChildren: () => import('./pages/appointments/appointments.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('attendance'), notCustomerScopeGuard]
  },
  {
    path: 'bot-config',
    loadChildren: () => import('./pages/bot-config/bot-config.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance'), notCustomerScopeGuard]
  },
  {
    path: 'ai-agents',
    loadChildren: () => import('./pages/ai-agents/ai-agents.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance'), notCustomerScopeGuard]
  },
  {
    path: 'ai-providers',
    loadChildren: () => import('./pages/ai-providers/ai-providers.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('auto_attendance'), notCustomerScopeGuard]
  },
  {
    path: 'products',
    loadChildren: () => import('./pages/products/products.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order'), notCustomerScopeGuard]
  },
  {
    path: 'customers',
    loadChildren: () => import('./pages/customers/customers.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order'), notCustomerScopeGuard]
  },
  {
    path: 'service-orders',
    loadChildren: () => import('./pages/service-orders/service-orders.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('service_order'), notCustomerScopeGuard]
  },
  {
    path: 'nfse',
    loadChildren: () => import('./pages/nfse/nfse.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('nfse'), notCustomerScopeGuard]
  },
  {
    path: 'financial',
    loadChildren: () => import('./pages/financial/financial.route').then(m => m.routes),
    canActivate: [authGuard, moduleGuard('financial'), roleGuard('administrator', 'company_admin', 'finance'), notCustomerScopeGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
