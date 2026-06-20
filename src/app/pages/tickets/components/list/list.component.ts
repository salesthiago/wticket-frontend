import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { TicketService } from '../services/ticket.service';
import { TicketCategoryService } from '../services/ticket-category.service';
import { TicketStatusService } from '../services/ticket-status.service';

// WhatsApp e Socket.io desabilitados temporariamente (serão serviços separados no futuro)
// import { WhatsappService } from '../../../whatsapp/components/services/whatsapp.service';

interface Ticket {
  _id: string;
  contactNumber?: string;
  contactName?: string;
  categoryId?: any;
  subjectId?: any;
  statusId?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: any;
  tags: string[];
  responses?: any[];
  lastMessage?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-tickets',
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    FormsModule,
    ProgressSpinnerModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    BreadcrumbModule,
    SidebarComponent
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  loading = true;
  errorMessage = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Tickets' }];

  // Filtros
  categoryFilter = '';
  statusFilter = '';
  priorityFilter = '';
  searchText = '';

  // Opções de filtro carregadas da API
  categoryOptions: any[] = [{ label: 'Todas as categorias', value: '' }];
  statusOptions: any[] = [{ label: 'Todos os status', value: '' }];

  priorityOptions = [
    { label: 'Todos', value: '' },
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
  ];

  constructor(
    private ticketService: TicketService,
    private categoryService: TicketCategoryService,
    private statusService: TicketStatusService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadFiltersData();
    this.loadTickets();
  }

  loadFiltersData(): void {
    this.categoryService.findAll(true).subscribe({
      next: (cats) => {
        this.categoryOptions = [
          { label: 'Todas as categorias', value: '' },
          ...cats.map(c => ({ label: c.name, value: c._id }))
        ];
      }
    });

    this.statusService.findAll(true).subscribe({
      next: (sts) => {
        this.statusOptions = [
          { label: 'Todos os status', value: '' },
          ...sts.map(s => ({ label: s.label, value: s._id }))
        ];
      }
    });
  }

  loadTickets(): void {
    this.loading = true;
    const params: any = {};
    if (this.categoryFilter) params['categoryId'] = this.categoryFilter;
    if (this.statusFilter) params['statusId'] = this.statusFilter;

    this.ticketService.getTickets(params).subscribe({
      next: (resp: Ticket[]) => {
        this.tickets = resp;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar tickets';
        this.loading = false;
      }
    });
  }

  openAttend(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket._id, 'attend']);
  }

  openSettings(): void {
    this.router.navigate(['/tickets/settings']);
  }

  get filteredTickets(): Ticket[] {
    return this.tickets.filter(ticket => {
      const matchesStatus = !this.statusFilter || ticket.statusId?._id === this.statusFilter || ticket.statusId === this.statusFilter;
      const matchesPriority = !this.priorityFilter || ticket.priority === this.priorityFilter;
      const matchesSearch = !this.searchText ||
        (ticket.contactNumber?.includes(this.searchText)) ||
        (ticket.contactName?.toLowerCase().includes(this.searchText.toLowerCase())) ||
        (ticket.subjectId?.name?.toLowerCase().includes(this.searchText.toLowerCase()));
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  get totalTickets() { return this.filteredTickets.length; }

  get highPriorityCount() {
    return this.filteredTickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
  }

  get withResponsesCount() {
    return this.filteredTickets.filter(t => (t.responses?.length ?? 0) > 0).length;
  }

  getPrioritySeverity(priority: string): string {
    const map: Record<string, string> = { low: 'success', medium: 'info', high: 'warning', urgent: 'danger' };
    return map[priority] || 'secondary';
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };
    return map[priority] || priority;
  }

  destroyTicket(id: string, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Realmente deseja deletar este ticket?',
      header: 'Atenção',
      icon: 'pi pi-info-circle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Deletar', severity: 'danger' },
      accept: () => {
        this.ticketService.destroy(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Ticket deletado' });
            this.loadTickets();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao deletar ticket' })
        });
      }
    });
  }
}
