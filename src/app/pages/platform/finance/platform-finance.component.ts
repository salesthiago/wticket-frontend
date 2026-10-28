import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { PlatformService } from '../services/platform.service';
import {
  BillingCompanyRow,
  BillingOverview,
  BillingSituation,
  BillingSituationLabels,
  BillingSituationSeverity,
  ChargeMethod,
  PaymentProvider,
  PaymentProviderLabels,
  PaymentStatus,
  PaymentStatusLabels,
  PaymentStatusSeverity,
  PlatformPayment
} from '../platform.interface';

@Component({
  selector: 'app-platform-finance',
  standalone: true,
  templateUrl: './platform-finance.component.html',
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule, TableModule, TagModule, TabsModule, InputTextModule,
    IconFieldModule, InputIconModule, InputNumberModule, SelectModule, SelectButtonModule, DatePickerModule,
    TextareaModule, ToggleSwitchModule, DialogModule, MessageModule, TooltipModule, ToastModule, ConfirmDialog,
    SidebarComponent
  ]
})
export class PlatformFinanceComponent implements OnInit {
  tab = 'companies';

  overview: BillingOverview | null = null;
  loadingOverview = false;
  companySearch = '';
  situationFilter: BillingSituation | '' = '';
  situationOptions = [
    { value: '', label: 'Todas as situações' },
    ...Object.entries(BillingSituationLabels).map(([value, label]) => ({ value, label }))
  ];

  payments: PlatformPayment[] = [];
  loadingPayments = false;
  paymentCompanyFilter = '';
  paymentStatusFilter: PaymentStatus | '' = '';
  paymentStatusOptions = [
    { value: '', label: 'Todos os status' },
    ...Object.entries(PaymentStatusLabels).map(([value, label]) => ({ value, label }))
  ];

  // Gerar cobrança
  chargeVisible = false;
  charging = false;
  chargeForm: { companyId: string; method: ChargeMethod; amount: number | null; dueDate: Date | null; description: string } = this.emptyCharge();
  chargeResult: PlatformPayment | null = null;
  methodOptions = [
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'credit_card', label: 'Cartão (link)' },
    { value: 'manual', label: 'Manual' }
  ];

  // Baixa manual
  payVisible = false;
  paying = false;
  payTarget: PlatformPayment | null = null;
  paidAt: Date = new Date();
  today = new Date();

  // Estorno
  refundVisible = false;
  refunding = false;
  refundTarget: PlatformPayment | null = null;
  refundReason = '';
  refundRevokeAccess = true;

  constructor(
    private service: PlatformService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadPayments();
  }

  loadOverview(): void {
    this.loadingOverview = true;
    this.service.getBillingOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.loadingOverview = false;
      },
      error: () => {
        this.loadingOverview = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar o financeiro' });
      }
    });
  }

  loadPayments(): void {
    this.loadingPayments = true;
    this.service.findPayments({ companyId: this.paymentCompanyFilter, status: this.paymentStatusFilter }).subscribe({
      next: (data) => {
        this.payments = data;
        this.loadingPayments = false;
      },
      error: () => {
        this.loadingPayments = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar cobranças' });
      }
    });
  }

  reloadAll(): void {
    this.loadOverview();
    this.loadPayments();
  }

  get companies(): BillingCompanyRow[] {
    const rows = this.overview?.companies ?? [];
    const term = this.companySearch.trim().toLowerCase();
    return rows.filter(c =>
      (!this.situationFilter || c.situation === this.situationFilter) &&
      (!term || c.name.toLowerCase().includes(term) || (c.document || '').includes(term))
    );
  }

  get companyOptions() {
    return (this.overview?.companies ?? []).map(c => ({ value: c._id, label: c.name }));
  }

  get paymentCompanyOptions() {
    return [{ value: '', label: 'Todas as empresas' }, ...this.companyOptions];
  }

  showHistory(c: BillingCompanyRow): void {
    this.paymentCompanyFilter = c._id;
    this.paymentStatusFilter = '';
    this.tab = 'payments';
    this.loadPayments();
  }

  isOverdueDate(date: string | null): boolean {
    return !!date && new Date(date) < new Date();
  }

  isDueSoon(date: string | null): boolean {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }

  // ─── Gerar cobrança ───────────────────────────────────────────────────────

  private emptyCharge() {
    return { companyId: '', method: 'pix' as ChargeMethod, amount: null, dueDate: null, description: '' };
  }

  openCharge(c?: BillingCompanyRow): void {
    this.chargeForm = this.emptyCharge();
    this.chargeResult = null;
    if (c) this.chargeForm.companyId = c._id;
    this.onChargeCompanyChange();
    this.chargeVisible = true;
  }

  get chargeCompany(): BillingCompanyRow | undefined {
    return this.overview?.companies.find(c => c._id === this.chargeForm.companyId);
  }

  onChargeCompanyChange(): void {
    this.chargeForm.amount = this.chargeCompany?.plan?.price ?? null;
  }

  submitCharge(): void {
    const f = this.chargeForm;
    if (!f.companyId) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione a empresa' });
      return;
    }
    if (f.method !== 'manual' && !this.chargeCompany?.plan) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'A empresa não tem plano — use cobrança manual ou defina um plano' });
      return;
    }
    if (f.method === 'manual' && !(Number(f.amount) > 0)) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o valor da cobrança' });
      return;
    }

    this.charging = true;
    this.service.createCharge({
      companyId: f.companyId,
      method: f.method,
      amount: f.method === 'manual' ? f.amount : undefined,
      dueDate: f.dueDate ? f.dueDate.toISOString() : null,
      description: f.description || undefined
    }).subscribe({
      next: (payment) => {
        this.charging = false;
        this.messageService.add({ severity: 'success', summary: 'Cobrança gerada', detail: this.chargeCompany?.name });
        // Pix/cartão: mantém o diálogo aberto para copiar o link / código.
        if (payment.checkoutUrl || payment.pix?.copyPaste || payment.boleto) this.chargeResult = payment;
        else this.chargeVisible = false;
        this.reloadAll();
      },
      error: (err) => {
        this.charging = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao gerar cobrança' });
      }
    });
  }

  copy(text: string | undefined, label = 'Copiado'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => this.messageService.add({ severity: 'info', summary: label, detail: 'Copiado para a área de transferência' }),
      () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível copiar' })
    );
  }

  // ─── Baixa / cancelamento / estorno ───────────────────────────────────────

  openMarkPaid(p: PlatformPayment): void {
    this.payTarget = p;
    this.paidAt = new Date();
    this.payVisible = true;
  }

  submitMarkPaid(): void {
    if (!this.payTarget) return;
    this.paying = true;
    this.service.markPaid(this.payTarget._id, this.paidAt.toISOString()).subscribe({
      next: () => {
        this.paying = false;
        this.payVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Baixa registrada', detail: 'Assinatura liberada/renovada' });
        this.reloadAll();
      },
      error: (err) => {
        this.paying = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao dar baixa' });
      }
    });
  }

  cancelPayment(p: PlatformPayment): void {
    this.confirmationService.confirm({
      header: 'Cancelar cobrança',
      message: `Cancelar a cobrança de ${p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${p.companyId?.name}?`,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Voltar', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { label: 'Cancelar cobrança', severity: 'danger' },
      accept: () => this.service.cancelPayment(p._id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Cobrança cancelada' });
          this.reloadAll();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao cancelar' })
      })
    });
  }

  openRefund(p: PlatformPayment): void {
    this.refundTarget = p;
    this.refundReason = '';
    this.refundRevokeAccess = true;
    this.refundVisible = true;
  }

  submitRefund(): void {
    if (!this.refundTarget) return;
    if (!this.refundReason.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o motivo do estorno' });
      return;
    }
    this.refunding = true;
    this.service.refundPayment(this.refundTarget._id, this.refundReason, this.refundRevokeAccess).subscribe({
      next: () => {
        this.refunding = false;
        this.refundVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Estorno registrado' });
        this.reloadAll();
      },
      error: (err) => {
        this.refunding = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao estornar' });
      }
    });
  }

  // ─── Helpers de template ──────────────────────────────────────────────────

  situationLabel(s: BillingSituation): string {
    return BillingSituationLabels[s] ?? s;
  }

  situationSeverity(s: BillingSituation) {
    return BillingSituationSeverity[s] ?? 'secondary';
  }

  paymentStatusLabel(s: PaymentStatus): string {
    return PaymentStatusLabels[s] ?? s;
  }

  paymentStatusSeverity(s: PaymentStatus) {
    return PaymentStatusSeverity[s] ?? 'secondary';
  }

  providerLabel(p: PaymentProvider): string {
    return PaymentProviderLabels[p] ?? p;
  }
}
