import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../services/service-orders.service';
import {
  ServiceOrderStatus,
  ServiceOrderPriority,
  ServiceOrderStatusLabels,
  ServiceOrderStatusColors,
  ServiceOrderPriorityLabels,
  ServiceOrderPriorityColors
} from '../../service-order.interface';
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
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
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
    DatePipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule,
    TooltipModule
  ]
})
export class ListComponent implements OnInit, OnDestroy {
  public items: any[] = [];
  public loading = false;
  public search = '';
  public filterStatus = '';
  public filterPriority = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Ordens de Serviço' }];

  public optionStatus = [
    { name: 'Todos', value: '' },
    { name: 'Aberta', value: 'open' },
    { name: 'Em Diagnóstico', value: 'diagnosing' },
    { name: 'Orçamento Enviado', value: 'quoted' },
    { name: 'Aprovada', value: 'approved' },
    { name: 'Em Execução', value: 'in_progress' },
    { name: 'Concluída', value: 'completed' },
    { name: 'Entregue', value: 'delivered' },
    { name: 'Cancelada', value: 'cancelled' }
  ];

  public optionPriority = [
    { name: 'Todas', value: '' },
    { name: 'Baixa', value: 'low' },
    { name: 'Normal', value: 'normal' },
    { name: 'Alta', value: 'high' },
    { name: 'Urgente', value: 'urgent' }
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private service: ServiceOrdersService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => this.loadData({ search: term, status: this.filterStatus, priority: this.filterPriority }));
  }

  ngOnInit() {
    this.loadData({});
  }

  public loadData(params: any) {
    this.loading = true;
    const queryParams: any = { ...params };
    if (this.filterStatus && !queryParams.status) queryParams.status = this.filterStatus;
    if (this.filterPriority && !queryParams.priority) queryParams.priority = this.filterPriority;

    this.service.findAll(queryParams).subscribe({
      next: (resp: any) => {
        this.items = resp.records ?? resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  public onSearch() {
    const term = this.search.trim();
    if (term.length === 0) {
      this.loadData({});
      return;
    }
    if (term.length < 2) return;
    this.searchSubject.next(term);
  }

  public onFilterChange() {
    this.loadData({ search: this.search.trim() || undefined });
  }

  public clearSearch() {
    this.search = '';
    this.loadData({});
  }

  public add() {
    this.router.navigate(['/service-orders/create']);
  }

  public view(id: string) {
    this.router.navigate(['/service-orders/view/' + id]);
  }

  public edit(id: string) {
    this.router.navigate(['/service-orders/edit/' + id]);
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja remover esta ordem de serviço?',
      header: 'Remover Ordem de Serviço',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.service.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ordem de serviço removida!' });
            this.loadData({});
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover a OS.' });
          }
        });
      }
    });
  }

  public getCustomerName(item: any): string {
    return item.customerId?.name ?? '—';
  }

  public getCustomerPhone(item: any): string {
    return item.customerId?.phone ?? '';
  }

  public getTechnicianName(item: any): string {
    return item.technicianId?.name ?? '—';
  }

  public getStatusLabel(status: ServiceOrderStatus): string {
    return ServiceOrderStatusLabels[status] ?? status;
  }

  public getStatusColor(status: ServiceOrderStatus): string {
    return ServiceOrderStatusColors[status] ?? 'info';
  }

  public getPriorityLabel(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityLabels[priority] ?? priority;
  }

  public getPriorityColor(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityColors[priority] ?? 'info';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
