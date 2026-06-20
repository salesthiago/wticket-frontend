import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { FinancialService } from '../services/financial.service';
import {
  Receivable,
  ReceivableStatus,
  ReceivableStatusLabels,
  ReceivableStatusColors,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentMethodIcons
} from '../../financial.interface';

@Component({
  selector: 'app-receivable-view',
  standalone: true,
  templateUrl: './view.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    Toast,
    ConfirmDialog,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    TimelineModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    MessageModule,
    SidebarComponent
  ]
})
export class ReceivableViewComponent implements OnInit {
  loading = false;
  item: Receivable | null = null;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Contas a Receber', routerLink: '/financial/receivables' },
    { label: 'Detalhes' }
  ];

  // Dialog: registrar baixa
  showPaymentDialog = false;
  payment: { date: Date; method: PaymentMethod | null; notes: string } = {
    date: new Date(),
    method: null,
    notes: ''
  };
  registering = false;

  // Dialog: estorno
  showReverseDialog = false;
  reverseNotes = '';
  reversing = false;

  // Dialog: cancelar
  showCancelDialog = false;
  cancelReason = '';
  cancelling = false;

  optionMethods: { label: string; value: PaymentMethod }[] = (Object.keys(PaymentMethodLabels) as PaymentMethod[])
    .map(k => ({ label: PaymentMethodLabels[k], value: k }));

  constructor(
    private financial: FinancialService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/financial/receivables']); return; }
    this.load(id);
  }

  private load(id: string) {
    this.loading = true;
    this.financial.getReceivable(id).subscribe({
      next: (r) => { this.item = r; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar título'
        });
      }
    });
  }

  back() { this.router.navigate(['/financial/receivables']); }
  edit() { if (this.item?._id) this.router.navigate(['/financial/receivables/edit', this.item._id]); }

  // ─── Helpers de status ──────────────────────────────────────────────────
  statusLabel(s?: ReceivableStatus): string { return s ? (ReceivableStatusLabels[s] || s) : ''; }
  statusColor(s?: ReceivableStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const c = s ? ReceivableStatusColors[s] : 'secondary';
    return (c as any) || 'secondary';
  }
  methodLabel(m?: string): string { return m ? (PaymentMethodLabels[m as PaymentMethod] || m) : '—'; }
  methodIcon(m?: string): string { return m ? (PaymentMethodIcons[m as PaymentMethod] || 'pi pi-credit-card') : 'pi pi-credit-card'; }

  canRegisterPayment(): boolean {
    return !!this.item && (this.item.status === 'pending' || this.item.status === 'overdue');
  }
  canReversePayment(): boolean { return this.item?.status === 'paid'; }
  canCancel(): boolean {
    return !!this.item && (this.item.status === 'pending' || this.item.status === 'overdue');
  }
  canEdit(): boolean {
    return !!this.item && (this.item.status === 'pending' || this.item.status === 'overdue');
  }

  // ─── Customer / OS info ─────────────────────────────────────────────────
  customerName(): string {
    if (!this.item) return '—';
    if (typeof this.item.customerId === 'object' && this.item.customerId) return this.item.customerId.name || '—';
    return '—';
  }
  customerDocument(): string {
    if (typeof this.item?.customerId === 'object' && this.item?.customerId?.document) return this.item.customerId.document;
    return '';
  }
  hasServiceOrder(): boolean {
    return !!(this.item && typeof this.item.serviceOrderId === 'object' && this.item.serviceOrderId?._id);
  }
  serviceOrderId(): string | null {
    if (typeof this.item?.serviceOrderId === 'object' && this.item?.serviceOrderId?._id) return this.item.serviceOrderId._id;
    return null;
  }
  serviceOrderLabel(): string {
    if (typeof this.item?.serviceOrderId === 'object' && this.item?.serviceOrderId?.orderNumber) return this.item.serviceOrderId.orderNumber;
    return '—';
  }

  daysToDue(): number | null {
    if (!this.item?.dueDate) return null;
    const due = new Date(this.item.dueDate); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ─── Registrar Baixa ────────────────────────────────────────────────────
  openPaymentDialog() {
    this.payment = {
      date: new Date(),
      method: this.item?.paymentMethod || 'pix',
      notes: ''
    };
    this.showPaymentDialog = true;
  }

  submitPayment() {
    if (!this.item?._id) return;
    if (!this.payment.date) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Data do pagamento é obrigatória' });
      return;
    }
    this.registering = true;
    this.financial.registerPayment(this.item._id, {
      paymentDate: this.payment.date,
      paymentMethod: this.payment.method || undefined,
      notes: this.payment.notes || undefined
    }).subscribe({
      next: (updated) => {
        this.registering = false;
        this.showPaymentDialog = false;
        this.item = updated;
        this.messageService.add({
          severity: 'success', summary: 'Baixa registrada',
          detail: `Título ${updated.number} marcado como pago.`
        });
      },
      error: (err) => {
        this.registering = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao registrar baixa'
        });
      }
    });
  }

  // ─── Estorno ────────────────────────────────────────────────────────────
  openReverseDialog() {
    this.reverseNotes = '';
    this.showReverseDialog = true;
  }

  submitReverse() {
    if (!this.item?._id) return;
    this.reversing = true;
    this.financial.reversePayment(this.item._id, this.reverseNotes || undefined).subscribe({
      next: (updated) => {
        this.reversing = false;
        this.showReverseDialog = false;
        this.item = updated;
        this.messageService.add({
          severity: 'success', summary: 'Estornado',
          detail: 'Pagamento estornado com sucesso.'
        });
      },
      error: (err) => {
        this.reversing = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao estornar'
        });
      }
    });
  }

  // ─── Cancelar ───────────────────────────────────────────────────────────
  openCancelDialog() {
    this.cancelReason = '';
    this.showCancelDialog = true;
  }

  submitCancel() {
    if (!this.item?._id) return;
    this.cancelling = true;
    this.financial.cancelReceivable(this.item._id, this.cancelReason || undefined).subscribe({
      next: (updated) => {
        this.cancelling = false;
        this.showCancelDialog = false;
        this.item = updated;
        this.messageService.add({
          severity: 'success', summary: 'Cancelado',
          detail: 'Título cancelado com sucesso.'
        });
      },
      error: (err) => {
        this.cancelling = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao cancelar'
        });
      }
    });
  }

  // ─── History ──────────────────────────────────────────────────────────
  historyChangedByName(entry: any): string {
    if (entry?.changedBy && typeof entry.changedBy === 'object') return entry.changedBy.name || '';
    return '';
  }
}
