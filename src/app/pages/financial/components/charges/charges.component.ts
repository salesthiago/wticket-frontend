import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Toast } from 'primeng/toast';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { ItauService } from '../services/itau.service';
import {
  ItauBoleto,
  ItauBoletoStatus,
  ItauBoletoStatusLabels,
  ItauBoletoStatusColors
} from '../../itau.interface';

/**
 * Financeiro › Cobrança.
 * Lista as cobranças (boletos) geradas pela integração Itaú, cada uma amarrada
 * ao seu título de Contas a Receber.
 */
@Component({
  selector: 'app-financial-charges',
  standalone: true,
  templateUrl: './charges.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    TooltipModule,
    BreadcrumbModule,
    Toast,
    SidebarComponent
  ]
})
export class FinancialChargesComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Cobrança' }
  ];

  items: ItauBoleto[] = [];
  total = 0;
  loading = false;
  rows = 20;
  first = 0;

  filterStatus = '';
  optionStatus = [
    { label: 'Todos os status', value: '' },
    ...(Object.keys(ItauBoletoStatusLabels) as ItauBoletoStatus[]).map(k => ({
      label: ItauBoletoStatusLabels[k], value: k
    }))
  ];

  busyId: string | null = null;

  constructor(
    private itau: ItauService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 20;
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: any = {
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows
    };
    if (this.filterStatus) params.status = this.filterStatus;

    this.itau.listBoletos(params).subscribe({
      next: (resp) => {
        this.items = resp?.records || [];
        this.total = resp?.total || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar as cobranças' });
      }
    });
  }

  applyFilters(): void {
    this.first = 0;
    this.load();
  }

  // ─── Vínculo com o título ────────────────────────────────────────────────
  receivableId(b: ItauBoleto): string | null {
    const r = b.receivableId;
    if (!r) return null;
    return typeof r === 'object' ? r._id : r;
  }
  receivableNumber(b: ItauBoleto): string {
    const r = b.receivableId;
    return (r && typeof r === 'object' && r.number) ? r.number : '—';
  }
  customerName(b: ItauBoleto): string {
    const c = b.customerId;
    return (c && typeof c === 'object' && c.name) ? c.name : '—';
  }
  openReceivable(b: ItauBoleto): void {
    const id = this.receivableId(b);
    if (id) this.router.navigate(['/financial/receivables/view', id]);
  }

  // ─── Ações ──────────────────────────────────────────────────────────────
  canCancel(b: ItauBoleto): boolean {
    return b.status === 'registrado' || b.status === 'vencido';
  }

  refresh(b: ItauBoleto): void {
    this.busyId = b._id;
    this.itau.refreshBoletoStatus(b._id).subscribe({
      next: (updated) => {
        this.busyId = null;
        Object.assign(b, updated);
        this.messageService.add({ severity: 'info', summary: 'Status atualizado', detail: this.statusLabel(b.status) });
      },
      error: (err) => {
        this.busyId = null;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao consultar o Itaú' });
      }
    });
  }

  cancel(b: ItauBoleto): void {
    this.busyId = b._id;
    this.itau.cancelBoleto(b._id).subscribe({
      next: (updated) => {
        this.busyId = null;
        Object.assign(b, updated);
        this.messageService.add({ severity: 'success', summary: 'Cobrança cancelada', detail: `Boleto ${b.nossoNumero || ''} baixado.` });
      },
      error: (err) => {
        this.busyId = null;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao cancelar' });
      }
    });
  }

  copyLine(b: ItauBoleto): void {
    if (!b.linhaDigitavel) return;
    navigator.clipboard?.writeText(b.linhaDigitavel).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Linha digitável copiada.' });
    });
  }

  statusLabel(s?: ItauBoletoStatus): string { return s ? (ItauBoletoStatusLabels[s] || s) : ''; }
  statusColor(s?: ItauBoletoStatus): string { return s ? (ItauBoletoStatusColors[s] || 'secondary') : 'secondary'; }
}
