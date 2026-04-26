import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, ModuleCode } from '../services/auth.service';

/**
 * Guard factory: requires the company to have a specific module active.
 * Usage in routes:
 *   { path: 'tickets', canActivate: [authGuard, moduleGuard('attendance')], ... }
 */
export const moduleGuard = (code: ModuleCode): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.hasModule(code)) return true;
    router.navigate(['/dashboard'], { queryParams: { denied: code } });
    return false;
  };
};

/**
 * Guard: super-admin only.
 */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.isSuperAdmin()) return true;
  router.navigate(['/dashboard']);
  return false;
};
