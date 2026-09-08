import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { SidebarComponent } from '../../../../../layout/sidebar/sidebar.component';
import { ItauService } from '../../services/itau.service';
import {
  ItauIntegrationLog,
  ItauLogOperation,
  ItauLogOperationLabels
} from '../../../itau.interface';

@Component({
  selector: 'app-itau-history',
  standalone: true,
  templateUrl: './itau-history.component.html',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    BreadcrumbModule,
    DialogModule,
    SidebarComponent
  ]
})
export class ItauHistoryComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Integração Itaú' },
    { label: 'Histórico de Integração' }
  ];

  items: ItauIntegrationLog[] = [];
  total = 0;
  loading = false;
  rows = 20;
  first = 0;

  filterOperation = '';
  filterSuccess = '';
  dateRange: Date[] | null = null;

  detail: ItauIntegrationLog | null = null;
  showDetail = false;

  optionOperation = [
    { name: 'Todas', value: '' },
    ...(Object.keys(ItauLogOperationLabels) as ItauLogOperation[]).map(k => ({
      name: ItauLogOperationLabels[k], value: k
    }))
  ];
  optionSuccess = [
    { name: 'Todos', value: '' },
    { name: 'Sucesso', value: 'true' },
    { name: 'Falha', value: 'false' }
  ];

  constructor(private itau: ItauService) {}

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
    if (this.filterOperation) params.operation = this.filterOperation;
    if (this.filterSuccess) params.success = this.filterSuccess;
    if (this.dateRange?.[0]) params.dateFrom = this.dateRange[0].toISOString();
    if (this.dateRange?.[1]) params.dateTo = this.dateRange[1].toISOString();

    this.itau.listLogs(params).subscribe({
      next: (resp) => {
        this.items = resp?.records || [];
        this.total = resp?.total || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.first = 0;
    this.load();
  }

  clearFilters(): void {
    this.filterOperation = '';
    this.filterSuccess = '';
    this.dateRange = null;
    this.applyFilters();
  }

  openDetail(row: ItauIntegrationLog): void {
    this.detail = row;
    this.showDetail = true;
  }

  operationLabel(op: string): string {
    return ItauLogOperationLabels[op as ItauLogOperation] || op;
  }

  pretty(value: any): string {
    if (value == null) return '—';
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
}
