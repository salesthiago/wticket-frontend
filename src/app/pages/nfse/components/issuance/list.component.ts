import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
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
import { NfseService } from '../services/nfse.service';
import {
  NfseIssuance,
  NfseStatus,
  NfseStatusLabels,
  NfseStatusColors
} from '../../nfse.interface';

@Component({
  selector: 'app-nfse-issuance-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    FormsModule,
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
export class IssuanceListComponent implements OnInit, OnDestroy {
  items: NfseIssuance[] = [];
  loading = false;
  total = 0;

  search = '';
  filterStatus = '';
  dateRange: Date[] | null = null;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'NFS-e' }, { label: 'Emissões' }];

  optionStatus = [
    { name: 'Todos', value: '' },
    { name: NfseStatusLabels.draft, value: 'draft' },
    { name: NfseStatusLabels.signing, value: 'signing' },
    { name: NfseStatusLabels.queued, value: 'queued' },
    { name: NfseStatusLabels.sending, value: 'sending' },
    { name: NfseStatusLabels.processing, value: 'processing' },
    { name: NfseStatusLabels.authorized, value: 'authorized' },
    { name: NfseStatusLabels.rejected, value: 'rejected' },
    { name: NfseStatusLabels.cancelled, value: 'cancelled' },
    { name: NfseStatusLabels.error, value: 'error' }
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private nfse: NfseService,
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
    if (this.dateRange?.[0]) params.dateFrom = this.dateRange[0].toISOString();
    if (this.dateRange?.[1]) params.dateTo = this.dateRange[1].toISOString();

    this.nfse.listIssuances(params).subscribe({
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
    this.dateRange = null;
    this.load();
  }

  add() { this.router.navigate(['/nfse/issuances/create']); }
  view(id: string) { this.router.navigate(['/nfse/issuances/view', id]); }

  confirmDelete(item: NfseIssuance) {
    this.confirmationService.confirm({
      message: `Arquivar a emissão DPS ${item.serie}/${item.nDPS}?`,
      header: 'Arquivar emissão',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Arquivar' },
      accept: () => {
        this.nfse.deleteIssuance(item._id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Emissão arquivada' });
            this.load();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: err?.error?.message || 'Falha ao arquivar'
            });
          }
        });
      }
    });
  }

  customerName(item: NfseIssuance): string {
    if (typeof item.customerId === 'object' && item.customerId) return item.customerId.name || '—';
    return item.tomador?.nome || '—';
  }

  statusLabel(s: NfseStatus): string { return NfseStatusLabels[s] || s; }
  statusColor(s: NfseStatus): string { return NfseStatusColors[s] || 'secondary'; }

  ngOnDestroy() { this.searchSubject.complete(); }
}
