import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/enviroment';

export type BillingBlockReason = 'trial_expired' | 'subscription_expired';
export type PaymentMethodCode = 'pix' | 'credit_card' | 'debit_card';

export interface BillingPayment {
  id: string;
  provider: 'abacatepay' | 'itau' | 'stripe';
  amount: number;
  status: string;
  checkoutUrl: string | null;
  pix: { qrCode: string; copyPaste: string; txid: string; expiresAt: string } | null;
  createdAt: string;
}

export interface BillingStatus {
  blocked: boolean;
  exempt?: boolean;
  reason?: BillingBlockReason;
  trialEndsAt?: string | null;
  /** null quando a empresa ainda não tem plano vinculado — checkout precisa deixar escolher um. */
  planId?: string | null;
  payment?: BillingPayment | null;
}

export interface AvailablePaymentMethod {
  method: PaymentMethodCode;
  providerKey: string;
}

export interface CheckoutRequest {
  method?: PaymentMethodCode;
  planId?: string;
}

export interface CheckoutResponse {
  paymentId: string;
  provider: string;
  amount: number;
  status: string;
  url?: string;
  pix?: { qrCode: string; copyPaste: string; txid: string; expiresAt: string };
}

/**
 * Status de billing da empresa logada (faixa de trial expirado + tela de
 * checkout). O estado fica em BehaviorSubject compartilhado para que a faixa
 * global (TrialBannerComponent) e a tela de checkout reajam à mesma consulta,
 * sem duplicar a chamada em cada componente.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private apiUrl = `${environment.apiUrl}/billing`;

  private statusSubject = new BehaviorSubject<BillingStatus | null>(null);
  readonly status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {}

  get current(): BillingStatus | null {
    return this.statusSubject.value;
  }

  /** Recarrega o status e atualiza o BehaviorSubject compartilhado. */
  refresh(): Observable<BillingStatus | null> {
    return this.http.get<BillingStatus>(`${this.apiUrl}/status`).pipe(
      tap(status => this.statusSubject.next(status)),
      catchError(() => {
        // Sem empresa vinculada (ex.: super_admin) ou erro de rede — não
        // bloqueia a navegação, só não exibe a faixa.
        this.statusSubject.next(null);
        return of(null);
      })
    );
  }

  clear(): void {
    this.statusSubject.next(null);
  }

  getMethods(): Observable<{ methods: AvailablePaymentMethod[] }> {
    return this.http.get<{ methods: AvailablePaymentMethod[] }>(`${this.apiUrl}/methods`);
  }

  checkout(payload: CheckoutRequest = {}): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/checkout`, payload);
  }

  getPayment(id: string): Observable<CheckoutResponse & { paidAt?: string }> {
    return this.http.get<CheckoutResponse & { paidAt?: string }>(`${this.apiUrl}/${id}`);
  }
}
