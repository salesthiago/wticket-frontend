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
import { AvatarModule } from 'primeng/avatar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TicketService } from '../services/ticket.service';
import { TicketStatusService } from '../services/ticket-status.service';
import { TicketCategoryService } from '../services/ticket-category.service';
import { TicketSubjectService } from '../services/ticket-subject.service';
import { ServiceOrdersService } from '../../../service-orders/components/services/service-orders.service';
import { AppointmentsService } from '../../../appointments/components/services/appointments.service';
import { UsersService } from '../../../users/components/services/users.service';
import { AuthService } from '../../../../services/auth.service';
import { RichTextEditorComponent } from '../../../../components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-ticket-attend',
  providers: [MessageService, ConfirmationService],
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
    AvatarModule,
    InputNumberModule,
    ConfirmDialogModule,
    TooltipModule,
    RichTextEditorComponent
  ],
  templateUrl: './attend.component.html',
  styleUrls: ['./attend.component.scss']
})
export class TicketAttendComponent implements OnInit {
  ticket: any = null;
  loading = true;
  responseLoading = false;
  newResponse: string | null = '';
  newResponseHours: number | null = null;
  selectedStatusId = '';

  uploadImage = (file: File) => this.ticketService.uploadImage(file);

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

  // Anexos (PDF/imagens)
  attachments: any[] = [];
  attachmentUploading = false;
  readonly attachmentAccept = 'application/pdf,image/jpeg,image/png,image/webp,image/gif';
  private readonly maxAttachmentSize = 20 * 1024 * 1024; // 20MB (mesmo limite da API)

  // Edição do conteúdo (somente enquanto o ticket não tiver respostas)
  showEditDialog = false;
  editLoading = false;
  editForm: any = { categoryId: '', subjectId: '', priority: 'medium', notes: '' };
  editCategoryOptions: any[] = [];
  editSubjectOptions: any[] = [];
  private allSubjects: any[] = [];
  editPriorityOptions = [
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
  ];

  // Designar tarefa para outro usuário (somente administradores)
  assignableUsers: any[] = [];
  selectedAssignUserId = '';
  assignLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private ticketStatusService: TicketStatusService,
    private ticketCategoryService: TicketCategoryService,
    private ticketSubjectService: TicketSubjectService,
    private serviceOrdersService: ServiceOrdersService,
    private appointmentsService: AppointmentsService,
    private usersService: UsersService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  // Acesso de cliente (portal restrito): não pode gerar OS/agendamento (a API bloqueia).
  get isCustomerScoped(): boolean {
    return this.authService.isCustomerScoped();
  }

  private get currentUserId(): string | null {
    return this.authService.getUser()?.id ?? null;
  }

  // Designar a tarefa para outro usuário: ação restrita a administradores.
  get isAdmin(): boolean {
    return this.authService.hasAnyRole('administrator', 'company_admin');
  }

  // Excluir a tarefa: só quem a criou ou um administrador.
  get canDeleteTicket(): boolean {
    if (!this.ticket) return false;
    if (this.isAdmin) return true;
    const ownerId = this.ticket.createdBy?._id || this.ticket.createdBy;
    return !!ownerId && !!this.currentUserId && ownerId === this.currentUserId;
  }

  // Excluir uma resposta: só quem a registrou ou um administrador.
  canDeleteResponse(response: any): boolean {
    if (this.isAdmin) return true;
    const ownerId = response?.respondedBy?._id || response?.respondedBy;
    return !!ownerId && !!this.currentUserId && ownerId === this.currentUserId;
  }

  // Conteúdo do ticket só pode ser editado enquanto não houver respostas.
  get canEditContent(): boolean {
    return !!this.ticket && !(this.ticket.responses?.length > 0);
  }

  // Excluir um anexo: só quem o enviou ou um administrador.
  canDeleteAttachment(attachment: any): boolean {
    if (this.isAdmin) return true;
    const ownerId = attachment?.uploadedBy?._id || attachment?.uploadedBy;
    return !!ownerId && !!this.currentUserId && ownerId === this.currentUserId;
  }

  // Diferencia no histórico quais respostas são do usuário logado (exibidas
  // à direita, como em um app de mensagens) das demais (à esquerda).
  isMyResponse(response: any): boolean {
    const responderId = response?.respondedBy?._id || response?.respondedBy;
    return !!responderId && !!this.currentUserId && responderId === this.currentUserId;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
      this.loadAttachments(id);
    }
    this.loadStatuses();
    this.checkModules();
    if (this.isAdmin) {
      this.loadAssignableUsers();
    }
  }

  // Usuários elegíveis para designação: apenas equipe interna (sem
  // customerId), já que um acesso de cliente não pode ser responsável por
  // atendimento.
  loadAssignableUsers(): void {
    this.usersService.findAll({ internalOnly: true, limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.assignableUsers = records.map((u: any) => ({ label: u.name, value: u._id }));
      }
    });
  }

  assignTicket(): void {
    if (!this.selectedAssignUserId) return;
    this.assignLoading = true;
    this.ticketService.assign(this.ticket._id, this.selectedAssignUserId).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.selectedAssignUserId = '';
        this.assignLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Tarefa designada com sucesso' });
      },
      error: (error) => {
        this.assignLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao designar tarefa'
        });
      }
    });
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

  loadAttachments(id: string): void {
    this.ticketService.getAttachments(id).subscribe({
      next: (attachments) => { this.attachments = attachments; },
      error: () => { this.attachments = []; }
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite reenviar o mesmo arquivo
    if (!file) return;

    if (!this.attachmentAccept.split(',').includes(file.type)) {
      this.messageService.add({ severity: 'warn', summary: 'Tipo não permitido', detail: 'Envie um PDF ou uma imagem.' });
      return;
    }
    if (file.size > this.maxAttachmentSize) {
      this.messageService.add({ severity: 'warn', summary: 'Arquivo muito grande', detail: 'O limite é 20MB.' });
      return;
    }

    this.attachmentUploading = true;
    this.ticketService.addAttachment(this.ticket._id, file).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
        this.attachmentUploading = false;
        this.messageService.add({ severity: 'success', summary: 'Anexo enviado' });
      },
      error: (error) => {
        this.attachmentUploading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao enviar anexo'
        });
      }
    });
  }

  deleteAttachment(attachment: any, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Excluir o anexo "${attachment.filename}"?`,
      header: 'Excluir Anexo',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      accept: () => {
        this.ticketService.deleteAttachment(this.ticket._id, attachment._id).subscribe({
          next: (attachments) => {
            this.attachments = attachments;
            this.messageService.add({ severity: 'success', summary: 'Anexo excluído' });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error?.error?.message || 'Erro ao excluir anexo'
            });
          }
        });
      }
    });
  }

  isImageAttachment(attachment: any): boolean {
    return (attachment?.mimetype || '').startsWith('image/');
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  openEditDialog(): void {
    this.editForm = {
      categoryId: this.ticket.categoryId?._id || this.ticket.categoryId || '',
      subjectId: this.ticket.subjectId?._id || this.ticket.subjectId || '',
      priority: this.ticket.priority || 'medium',
      notes: this.ticket.notes || ''
    };
    if (!this.editCategoryOptions.length) {
      this.ticketCategoryService.findAll(true).subscribe({
        next: (cats) => { this.editCategoryOptions = cats.map((c: any) => ({ label: c.name, value: c._id })); }
      });
    }
    if (this.allSubjects.length) {
      this.refreshEditSubjects();
    } else {
      this.ticketSubjectService.findAll().subscribe({
        next: (data) => { this.allSubjects = data; this.refreshEditSubjects(); }
      });
    }
    this.showEditDialog = true;
  }

  onEditCategoryChange(): void {
    this.editForm.subjectId = '';
    this.refreshEditSubjects();
  }

  private refreshEditSubjects(): void {
    this.editSubjectOptions = this.allSubjects
      .filter(s => (s.isActive || s._id === this.editForm.subjectId)
        && (s.categoryId?._id ?? s.categoryId) === this.editForm.categoryId)
      .map(s => ({ label: s.name, value: s._id }));
  }

  saveContent(): void {
    this.editLoading = true;
    this.ticketService.updateContent(this.ticket._id, {
      categoryId: this.editForm.categoryId || null,
      subjectId: this.editForm.subjectId || null,
      priority: this.editForm.priority,
      notes: this.editForm.notes || ''
    }).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.editLoading = false;
        this.showEditDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Ticket atualizado' });
      },
      error: (error) => {
        this.editLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao atualizar ticket'
        });
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
    // Acesso de cliente nunca vê essas ações (a API já bloqueia).
    if (this.isCustomerScoped) {
      this.hasServiceOrderModule = false;
      this.hasAppointmentModule = false;
      return;
    }
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
    if (!this.newResponse) return;
    this.responseLoading = true;
    const hours = this.newResponseHours ?? 0;
    this.ticketService.addResponse(this.ticket._id, this.newResponse, hours).subscribe({
      next: (updated) => {
        this.ticket = updated;
        this.newResponse = '';
        this.newResponseHours = null;
        this.responseLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Resposta registrada' });
      },
      error: () => {
        this.responseLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao registrar resposta' });
      }
    });
  }

  deleteResponse(response: any, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Excluir esta resposta? As horas lançadas nela serão descontadas do total da tarefa.',
      header: 'Excluir Resposta',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      accept: () => {
        this.ticketService.deleteResponse(this.ticket._id, response._id).subscribe({
          next: (updated) => {
            this.ticket = updated;
            this.messageService.add({ severity: 'success', summary: 'Resposta excluída' });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error?.error?.message || 'Erro ao excluir resposta'
            });
          }
        });
      }
    });
  }

  deleteTicket(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Excluir esta tarefa? Essa ação não pode ser desfeita.',
      header: 'Excluir Tarefa',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      accept: () => {
        this.ticketService.destroy(this.ticket._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Tarefa excluída' });
            this.goBack();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error?.error?.message || 'Erro ao excluir tarefa'
            });
          }
        });
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
