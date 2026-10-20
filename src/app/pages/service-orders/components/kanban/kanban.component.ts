import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ServiceOrdersService } from '../services/service-orders.service';
import {
  ServiceOrderStatus,
  ServiceOrderStatusOrder,
  ServiceOrderStatusLabels,
  ServiceOrderPriority,
  ServiceOrderPriorityLabels,
  ServiceOrderPriorityColors
} from '../../service-order.interface';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

interface KanbanColumn {
  status: ServiceOrderStatus;
  label: string;
  color: string;
  orders: any[];
}

// Cor da borda superior de cada coluna (status fixos da OS).
const STATUS_COLUMN_COLORS: Record<ServiceOrderStatus, string> = {
  open: '#3b82f6',
  diagnosing: '#f59e0b',
  quoted: '#eab308',
  approved: '#22c55e',
  in_progress: '#6366f1',
  completed: '#10b981',
  delivered: '#64748b',
  cancelled: '#ef4444'
};

// Colunas de OS encerradas — escondidas por padrão para o quadro não crescer sem fim.
const CLOSED_STATUSES: ServiceOrderStatus[] = ['delivered', 'cancelled'];

// Quantas OS o quadro carrega de uma vez (as mais recentes).
const KANBAN_LIMIT = 500;

@Component({
  selector: 'app-service-orders-kanban',
  standalone: true,
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    DatePipe,
    FormsModule,
    DragDropModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToggleSwitchModule,
    ConfirmDialog,
    Toast,
    BreadcrumbModule,
    SidebarComponent
  ]
})
export class ServiceOrdersKanbanComponent implements OnInit {
  public items: any[] = [];
  public total = 0;
  public columns: KanbanColumn[] = [];
  public loading = false;
  public search = '';
  public showClosed = false;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Ordens de Serviço', routerLink: '/service-orders' }, { label: 'Kanban' }];

  constructor(
    private service: ServiceOrdersService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  public loadData() {
    this.loading = true;
    this.service.findAll({ limit: KANBAN_LIMIT }).subscribe({
      next: (resp: any) => {
        this.items = resp.records ?? resp;
        this.total = resp.total ?? this.items.length;
        this.loading = false;
        this.buildColumns();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ordens de serviço' });
      }
    });
  }

  get filteredItems(): any[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.items;
    return this.items.filter(item =>
      item.orderNumber?.toLowerCase().includes(term) ||
      item.reportedIssue?.toLowerCase().includes(term) ||
      item.equipment?.type?.toLowerCase().includes(term) ||
      item.equipment?.plate?.toLowerCase().includes(term) ||
      this.getCustomerName(item).toLowerCase().includes(term)
    );
  }

  public buildColumns() {
    const items = this.filteredItems;
    this.columns = ServiceOrderStatusOrder
      .filter(status => this.showClosed || !CLOSED_STATUSES.includes(status))
      .map(status => ({
        status,
        label: ServiceOrderStatusLabels[status],
        color: STATUS_COLUMN_COLORS[status],
        orders: items.filter(item => item.status === status)
      }));
  }

  public drop(event: CdkDragDrop<any[]>, target: KanbanColumn) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const order = event.previousContainer.data[event.previousIndex];
    const move = () => {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.changeStatus(order, target);
    };

    // Cancelar devolve as peças ao estoque — pede confirmação.
    if (target.status === 'cancelled') {
      this.confirmationService.confirm({
        message: `Cancelar a OS ${order.orderNumber}? As peças baixadas voltam para o estoque.`,
        header: 'Cancelar OS',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
        acceptButtonProps: { severity: 'danger', label: 'Cancelar OS' },
        accept: move
      });
      return;
    }
    move();
  }

  private changeStatus(order: any, target: KanbanColumn) {
    const previousStatus = order.status;
    const wasLeadQuote = this.isLeadQuote(order);
    order.status = target.status;

    this.service.updateStatus(order._id, { status: target.status }).subscribe({
      next: (updated: any) => {
        Object.assign(order, updated);
        const detail = wasLeadQuote && updated?.customerId
          ? `Orçamento aprovado: ${this.getCustomerName(updated)} agora é cliente.`
          : `OS ${order.orderNumber} movida para "${target.label}"`;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail });
      },
      error: (error: any) => {
        order.status = previousStatus;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Não foi possível mover a OS.' });
        this.buildColumns();
      }
    });
  }

  public view(id: string) {
    this.router.navigate(['/service-orders/view/' + id]);
  }

  public goToList() {
    this.router.navigate(['/service-orders/list']);
  }

  public add() {
    this.router.navigate(['/service-orders/create']);
  }

  public isLeadQuote(item: any): boolean {
    return !item.customerId && !!item.leadId;
  }

  public getCustomerName(item: any): string {
    return item.customerId?.name ?? item.leadId?.name ?? '—';
  }

  public getPriorityLabel(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityLabels[priority] ?? priority;
  }

  public getPriorityColor(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityColors[priority] ?? 'info';
  }
}
