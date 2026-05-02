import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';

/**
 * Guard factory: requer que o usuário tenha uma das roles informadas.
 * `super_admin` é sempre liberado (verificado dentro de `hasAnyRole`).
 *
 * Uso em rotas:
 *   { path: 'financial',
 *     canActivate: [authGuard, moduleGuard('financial'), roleGuard('administrator', 'finance')] }
 */
export const roleGuard = (...allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.hasAnyRole(...allowedRoles)) return true;
    router.navigate(['/dashboard'], { queryParams: { denied: 'role' } });
    return false;
  };
};
