import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { FinancialService } from '../services/financial.service';
import {
  Receivable,
  ReceivableStatus,
  ReceivableStatusLabels,
  ReceivableStatusColors,
  PaymentMethod,
  PaymentMethodLabels
} from '../../financial.interface';

@Component({
  selector: 'app-receivables-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ConfirmDialog,
    Toast,
    TagModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    BreadcrumbModule,
    SidebarComponent
  ]
})
export class ReceivablesListComponent implements OnInit, OnDestroy {
  items: Receivable[] = [];
  loading = false;
  total = 0;

  search = '';
  filterStatus = '';
  filterMethod = '';
  dueRange: Date[] | null = null;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Financeiro' }, { label: 'Contas a Receber' }];

  optionStatus = [
    { name: 'Todos', value: '' },
    { name: ReceivableStatusLabels.pending, value: 'pending' },
    { name: ReceivableStatusLabels.overdue, value: 'overdue' },
    { name: ReceivableStatusLabels.paid, value: 'paid' },
    { name: ReceivableStatusLabels.cancelled, value: 'cancelled' }
  ];

  optionMethods: { name: string; value: string }[] = [
    { name: 'Todas as formas', value: '' },
    ...(Object.keys(PaymentMethodLabels) as PaymentMethod[]).map(k => ({
      name: PaymentMethodLabels[k],
      value: k
    }))
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private financial: FinancialService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.load());
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params: any = { limit: 20 };
    if (this.search) params.search = this.search;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterMethod) params.paymentMethod = this.filterMethod;
    if (this.dueRange?.[0]) params.dueFrom = this.dueRange[0].toISOString();
    if (this.dueRange?.[1]) params.dueTo = this.dueRange[1].toISOString();

    this.financial.listReceivables(params).subscribe({
      next: (resp) => {
        this.items = resp?.records || [];
        this.total = resp?.total || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    const term = this.search.trim();
    if (term.length === 0) { this.load(); return; }
    if (term.length < 2) return;
    this.searchSubject.next(term);
  }

  clearFilters() {
    this.search = '';
    this.filterStatus = '';
    this.filterMethod = '';
    this.dueRange = null;
    this.load();
  }

  add() { this.router.navigate(['/financial/receivables/create']); }
  view(id: string) { this.router.navigate(['/financial/receivables/view', id]); }
  edit(id: string) { this.router.navigate(['/financial/receivables/edit', id]); }

  confirmCancel(item: Receivable) {
    this.confirmationService.confirm({
      message: `Cancelar o título ${item.number}?`,
      header: 'Cancelar título',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Voltar', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Cancelar título' },
      accept: () => {
        this.financial.cancelReceivable(item._id!, 'Cancelado pela lista').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Título cancelado' });
            this.load();
          },
          error: (err) => this.messageService.add({
            severity: 'error', summary: 'Erro',
            detail: err?.error?.message || 'Falha ao cancelar'
          })
        });
      }
    });
  }

  customerName(item: Receivable): string {
    if (typeof item.customerId === 'object' && item.customerId) return item.customerId.name || '—';
    return '—';
  }

  serviceOrderLabel(item: Receivable): string {
    if (typeof item.serviceOrderId === 'object' && item.serviceOrderId) return item.serviceOrderId.orderNumber || '—';
    return '—';
  }

  hasServiceOrder(item: Receivable): boolean {
    return !!(typeof item.serviceOrderId === 'object' && item.serviceOrderId?._id);
  }

  serviceOrderId(item: Receivable): string | null {
    if (typeof item.serviceOrderId === 'object' && item.serviceOrderId?._id) return item.serviceOrderId._id;
    return null;
  }

  statusLabel(s: ReceivableStatus): string { return ReceivableStatusLabels[s] || s; }
  statusColor(s: ReceivableStatus): string { return ReceivableStatusColors[s] || 'secondary'; }
  methodLabel(m?: string): string { return m ? (PaymentMethodLabels[m as PaymentMethod] || m) : '—'; }

  canEdit(s: ReceivableStatus): boolean { return s === 'pending' || s === 'overdue'; }
  canCancel(s: ReceivableStatus): boolean { return s === 'pending' || s === 'overdue'; }

  ngOnDestroy() { this.searchSubject.complete(); }
}
