import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { FinancialService } from '../services/financial.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import {
  Receivable,
  ReceivableCreateInput,
  ReceivableUpdateInput,
  PaymentMethod,
  PaymentMethodLabels,
  ReceivableStatusLabels,
  ReceivableStatusColors,
  ReceivableStatus
} from '../../financial.interface';

@Component({
  selector: 'app-receivable-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    Toast,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    MessageModule,
    TagModule,
    SidebarComponent
  ]
})
export class ReceivableFormComponent implements OnInit {
  id: string | null = null;
  loading = false;
  saving = false;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Contas a Receber', routerLink: '/financial/receivables' },
    { label: 'Novo Lançamento' }
  ];

  // Form model
  description = '';
  amount: number | null = null;
  dueDate: Date = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
  paymentMethod: PaymentMethod = 'pix';
  customerId: string | null = null;
  notes = '';

  // Catálogos
  customers: any[] = [];
  optionCustomers: { label: string; value: string }[] = [];
  optionMethods: { label: string; value: PaymentMethod }[] = (Object.keys(PaymentMethodLabels) as PaymentMethod[])
    .map(k => ({ label: PaymentMethodLabels[k], value: k }));

  // Em modo edição: status atual (read-only)
  currentStatus: ReceivableStatus | null = null;
  currentNumber: string | null = null;
  serviceOrderInfo: { _id: string; orderNumber?: string } | null = null;

  constructor(
    private financial: FinancialService,
    private customersService: CustomersService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.breadcrumbItems = [
        { label: 'Financeiro' },
        { label: 'Contas a Receber', routerLink: '/financial/receivables' },
        { label: 'Editar Lançamento' }
      ];
    }

    // Carregar customers (para vínculo opcional)
    this.customersService.findAll({ limit: 500 }).subscribe({
      next: (resp) => {
        this.customers = resp?.records || resp || [];
        this.optionCustomers = this.customers.map(c => ({
          label: c.document ? `${c.name} • ${c.document}` : c.name,
          value: c._id
        }));
      }
    });

    if (this.id) this.loadById(this.id);
  }

  private loadById(id: string) {
    this.loading = true;
    this.financial.getReceivable(id).subscribe({
      next: (r: Receivable) => {
        this.description = r.description || '';
        this.amount = r.amount;
        this.dueDate = r.dueDate ? new Date(r.dueDate) : new Date();
        this.paymentMethod = r.paymentMethod;
        this.notes = r.notes || '';
        if (typeof r.customerId === 'object' && r.customerId) {
          this.customerId = r.customerId._id;
        } else if (typeof r.customerId === 'string') {
          this.customerId = r.customerId;
        }
        if (typeof r.serviceOrderId === 'object' && r.serviceOrderId) {
          this.serviceOrderInfo = { _id: r.serviceOrderId._id, orderNumber: r.serviceOrderId.orderNumber };
        }
        this.currentStatus = r.status;
        this.currentNumber = r.number || null;
        this.loading = false;

        // Bloqueio de edição quando status não permite
        if (r.status === 'paid' || r.status === 'cancelled') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Edição bloqueada',
            detail: r.status === 'paid'
              ? 'Título pago não pode ser editado. Estorne primeiro.'
              : 'Título cancelado não pode ser editado.'
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar título'
        });
      }
    });
  }

  isReadOnly(): boolean {
    return !!this.id && (this.currentStatus === 'paid' || this.currentStatus === 'cancelled');
  }

  statusLabel(s?: ReceivableStatus | null): string { return s ? (ReceivableStatusLabels[s] || s) : ''; }
  statusColor(s?: ReceivableStatus | null): string { return s ? (ReceivableStatusColors[s] || 'secondary') : 'secondary'; }

  save() {
    if (!this.description) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Descrição é obrigatória.' });
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Valor deve ser maior que zero.' });
      return;
    }
    if (!this.dueDate) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Data de vencimento é obrigatória.' });
      return;
    }

    this.saving = true;

    if (this.id) {
      const patch: ReceivableUpdateInput = {
        description: this.description,
        amount: Number(this.amount),
        dueDate: this.dueDate,
        paymentMethod: this.paymentMethod,
        customerId: this.customerId || undefined,
        notes: this.notes || undefined
      };
      this.financial.updateReceivable(this.id, patch).subscribe({
        next: () => {
          this.saving = false;
          this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Título atualizado' });
          setTimeout(() => this.router.navigate(['/financial/receivables/view', this.id]), 600);
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error', summary: 'Erro',
            detail: err?.error?.message || 'Falha ao salvar'
          });
        }
      });
    } else {
      const payload: ReceivableCreateInput = {
        description: this.description,
        amount: Number(this.amount),
        dueDate: this.dueDate,
        paymentMethod: this.paymentMethod,
        customerId: this.customerId || undefined,
        notes: this.notes || undefined
      };
      this.financial.createReceivable(payload).subscribe({
        next: (created) => {
          this.saving = false;
          this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Lançamento criado' });
          setTimeout(() => this.router.navigate(['/financial/receivables/view', created._id]), 600);
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error', summary: 'Erro',
            detail: err?.error?.message || 'Falha ao criar lançamento'
          });
        }
      });
    }
  }

  cancel() { this.router.navigate(['/financial/receivables']); }
}
