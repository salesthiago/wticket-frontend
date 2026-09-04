import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription, interval, switchMap, takeWhile } from 'rxjs';
import {
  AvailablePaymentMethod,
  BillingService,
  BillingStatus,
  CheckoutResponse,
  PaymentMethodCode
} from '../../services/billing.service';

const METHOD_LABELS: Record<PaymentMethodCode, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito'
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  providers: [MessageService],
  imports: [CommonModule, RouterModule, ToastModule, CardModule, ButtonModule, TagModule]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  loading = true;
  generating = false;
  redirecting = false;

  status: BillingStatus | null = null;
  methods: AvailablePaymentMethod[] = [];
  payment: CheckoutResponse | null = null;

  private pollSub?: Subscription;

  readonly methodLabels = METHOD_LABELS;

  constructor(
    private billingService: BillingService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.billingService.refresh().subscribe(status => {
      this.status = status;
      // Cobrança já garantida pelo backend (job de expiração / gate de billing) —
      // mostra direto, sem exigir que o usuário escolha uma forma de novo.
      if (status?.payment) {
        this.payment = {
          paymentId: status.payment.id,
          provider: status.payment.provider,
          amount: status.payment.amount,
          status: status.payment.status,
          url: status.payment.checkoutUrl || undefined,
          pix: status.payment.pix || undefined
        };
        this.startPolling(status.payment.id);
      }
      this.loading = false;
    });

    this.billingService.getMethods().subscribe({
      next: (res) => this.methods = res.methods,
      error: () => this.methods = []
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get pixQrImageUrl(): string {
    const payload = this.payment?.pix?.copyPaste || this.payment?.pix?.qrCode || '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
  }

  methodLabel(code: PaymentMethodCode): string {
    return METHOD_LABELS[code] || code;
  }

  choose(method: PaymentMethodCode): void {
    this.generating = true;
    this.billingService.checkout({ method }).subscribe({
      next: (res) => {
        this.generating = false;
        this.payment = res;
        if (method === 'credit_card' && res.url) {
          this.redirecting = true;
          window.location.href = res.url;
          return;
        }
        this.startPolling(res.paymentId);
      },
      error: (err) => {
        this.generating = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Não foi possível gerar a cobrança'
        });
      }
    });
  }

  payNow(): void {
    if (!this.payment?.url) return;
    this.redirecting = true;
    window.location.href = this.payment.url;
  }

  copyPixCode(): void {
    const code = this.payment?.pix?.copyPaste;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Código Pix copiado', life: 2500 });
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private startPolling(paymentId: string): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(5000)
      .pipe(
        switchMap(() => this.billingService.getPayment(paymentId)),
        takeWhile((p) => p.status === 'pending', true)
      )
      .subscribe(p => {
        if (p.status === 'paid') {
          this.billingService.refresh().subscribe();
          this.messageService.add({
            severity: 'success',
            summary: 'Pagamento confirmado',
            detail: 'Assinatura liberada! Redirecionando...',
            life: 3000
          });
          setTimeout(() => this.goToDashboard(), 2500);
        }
      });
  }
}
