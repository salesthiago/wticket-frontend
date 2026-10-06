import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { BillingService } from '../services/billing.service';

/**
 * Qualquer gravação (POST/PUT/PATCH/DELETE) bloqueada pelo backend por
 * trial/assinatura vencidos volta com 402 (ver billing-guard.middleware.js).
 * Redireciona para a tela de checkout — a própria requisição original segue
 * rejeitada (o componente que a disparou trata o loading normalmente).
 */
export const billingInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const billingService = inject(BillingService);

  return next(req).pipe(
    catchError((error) => {
      if (error?.status === 402 && router.url !== '/checkout') {
        billingService.refresh().subscribe();
        router.navigate(['/checkout']);
      }
      return throwError(() => error);
    })
  );
};
