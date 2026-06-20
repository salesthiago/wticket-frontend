import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { MessageService, MenuItem } from 'primeng/api';
import { TicketService } from '../services/ticket.service';
import { TicketStatusService } from '../services/ticket-status.service';
import { ServiceOrdersService } from '../../../service-orders/components/services/service-orders.service';
import { AppointmentsService } from '../../../appointments/components/services/appointments.service';

@Component({
  selector: 'app-ticket-attend',
  providers: [MessageService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    SelectModule,
    TextareaModule,
    InputTextModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    BreadcrumbModule,
    DialogModule,
    TimelineModule,
    AvatarModule
  ],
  templateUrl: './attend.component.html',
  styleUrls: ['./attend.component.scss']
})
export class TicketAttendComponent implements OnInit {
  ticket: any = null;
  loading = true;
  responseLoading = false;
  newResponse = '';
  selectedStatusId = '';

  statuses: any[] = [];

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Tickets', routerLink: '/tickets/list' },
    { label: 'Atendimento' }
  ];

  // Módulos opcionais — verificar se o plano/cliente tem ativo
  hasServiceOrderModule = false;
  hasAppointmentModule = false;

  // Dialogs
  showServiceOrderDialog = false;
  showAppointmentDialog = false;
  serviceOrderLoading = false;
  appointmentLoading = false;

  // Formulário de OS
  serviceOrderForm: any = {
    reportedIssue: '',
    priority: 'normal',
    equipment: { type: '', brand: '', model: '', serialNumber: '' }
  };

  // Formulário de agendamento
  appointmentForm: any = {
    scheduledDate: '',
    scheduledTime: '',
    description: '',
    service: ''
  };

  priorityOptions = [
    { label: 'Baixa', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private ticketStatusService: TicketStatusService,
    private serviceOrdersService: ServiceOrdersService,
    private appointmentsService: AppointmentsService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
    }
    this.loadStatuses();
    this.checkModules();
  }

  loadTicket(id: string): void {
    this.loading = true;
    this.ticketService.findById(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.selectedStatusId = ticket.statusId?._id || ticket.statusId || '';
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro ao carregar ticket' });
        this.loading = false;
      }
    });
  }

  loadStatuses(): void {
    this.ticketStatusService.findAll(true).subscribe({
      next: (statuses) => {
        this.statuses = statuses.map(s => ({ label: s.label, value: s._id }));
      },
      error: () => { this.statuses = []; }
    });
  }

  checkModules(): void {
    // Verifica se os módulos estão ativos no plano do cliente via licença
    // A verificação real deve ser feita via endpoint de licença/perfil
    try {
      const license = JSON.parse(localStorage.getItem('license') || '{}');
      const features: string[] = license?.features || [];
      this.hasServiceOrderModule = features.includes('service-orders');
      this.hasAppointmentModule = features.includes('appointments');
    } catch {
      this.hasServiceOrderModule = false;
      this.hasAppointmentModule = false;
    }
  }

  saveResponse(): void {
    if (!this.newResponse.trim()) return;
    this.responseLoading = true;
    this.ticketService.addResponse(this.ticket._id, this.newResponse.trim()).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.newResponse = '';
        this.responseLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Resposta registrada' });
      },
      error: () => {
        this.responseLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao registrar resposta' });
      }
    });
  }

  changeStatus(): void {
    if (!this.selectedStatusId) return;
    this.ticketService.updateStatus(this.ticket._id, this.selectedStatusId).subscribe({
      next: (updated) => {
        this.ticket.statusId = updated.statusId;
        this.messageService.add({ severity: 'success', summary: 'Status atualizado' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro ao atualizar status' });
      }
    });
  }

  openServiceOrderDialog(): void {
    this.serviceOrderForm = {
      reportedIssue: '',
      priority: 'normal',
      equipment: { type: '', brand: '', model: '', serialNumber: '' }
    };
    this.showServiceOrderDialog = true;
  }

  createServiceOrder(): void {
    if (!this.serviceOrderForm.reportedIssue.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Informe o problema relatado' });
      return;
    }
    this.serviceOrderLoading = true;
    const payload = {
      ...this.serviceOrderForm,
      customerId: this.ticket?.contactNumber,
      ticketId: this.ticket?._id
    };
    this.serviceOrdersService.create(payload).subscribe({
      next: (os) => {
        this.ticketService.update(this.ticket._id, { serviceOrderId: os._id }).subscribe();
        this.ticket.serviceOrderId = os;
        this.showServiceOrderDialog = false;
        this.serviceOrderLoading = false;
        this.messageService.add({ severity: 'success', summary: `OS ${os.orderNumber} gerada com sucesso` });
      },
      error: () => {
        this.serviceOrderLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao gerar Ordem de Serviço' });
      }
    });
  }

  openAppointmentDialog(): void {
    this.appointmentForm = {
      scheduledDate: '',
      scheduledTime: '',
      description: '',
      service: ''
    };
    this.showAppointmentDialog = true;
  }

  createAppointment(): void {
    if (!this.appointmentForm.scheduledDate || !this.appointmentForm.scheduledTime) {
      this.messageService.add({ severity: 'warn', summary: 'Informe data e horário do agendamento' });
      return;
    }
    this.appointmentLoading = true;
    const payload = {
      ...this.appointmentForm,
      ticketId: this.ticket?._id,
      contactNumber: this.ticket?.contactNumber,
      contactName: this.ticket?.contactName
    };
    this.appointmentsService.create(payload).subscribe({
      next: (appointment) => {
        this.ticketService.update(this.ticket._id, { appointmentId: appointment._id }).subscribe();
        this.ticket.appointmentId = appointment;
        this.showAppointmentDialog = false;
        this.appointmentLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Visita agendada com sucesso' });
      },
      error: () => {
        this.appointmentLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao agendar visita' });
      }
    });
  }

  getStatusColor(): string {
    return this.ticket?.statusId?.color || '#6c757d';
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente'
    };
    return map[priority] || priority;
  }

  getPrioritySeverity(priority: string): string {
    const map: Record<string, string> = {
      low: 'success', medium: 'info', high: 'warning', urgent: 'danger'
    };
    return map[priority] || 'secondary';
  }

  goBack(): void {
    this.router.navigate(['/tickets/list']);
  }
}
