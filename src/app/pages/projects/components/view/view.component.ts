import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProjectsService } from '../services/projects.service';
import { TicketService } from '../../../tickets/components/services/ticket.service';
import { TicketStatusService } from '../../../tickets/components/services/ticket-status.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import { AuthService } from '../../../../services/auth.service';
import { ProjectPriority, ProjectPriorityLabels, ProjectPrioritySeverity, ProjectDocumentModel } from '../../project.interface';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ProgressSpinnerModule,
    ToastModule,
    BreadcrumbModule,
    TooltipModule,
    ConfirmDialogModule,
    SidebarComponent
  ],
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ProjectViewComponent implements OnInit {
  project: any = null;
  tasks: any[] = [];
  loading = true;
  tasksLoading = false;
  exporting = false;

  tasksViewMode: 'list' | 'kanban' = 'list';
  tasksSearch = '';
  taskStatuses: any[] = [];
  taskColumns: { status: any; tasks: any[] }[] = [];

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Projetos', routerLink: '/projects' },
    { label: 'Detalhes' }
  ];

  taskDialog = false;
  taskLoading = false;
  taskForm: any = { customerId: '', priority: 'medium', statusId: '', notes: '', startDate: undefined, endDate: undefined };
  customerOptions: any[] = [];
  statusOptions: any[] = [];
  documents: ProjectDocumentModel[] = [];

  priorityOptions = [
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
  ];

  private id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ProjectsService,
    private ticketService: TicketService,
    private ticketStatusService: TicketStatusService,
    private customersService: CustomersService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  // Acesso de cliente (portal restrito): não pode listar clientes (a API
  // bloqueia) e nem precisa, já que o backend já força o próprio cliente.
  get isCustomerScoped(): boolean {
    return this.authService.isCustomerScoped();
  }

  // Exclusão só é permitida para quem criou o projeto ou para administradores.
  get canDelete(): boolean {
    if (!this.project) return false;
    if (this.authService.hasAnyRole('administrator', 'company_admin')) return true;
    const ownerId = this.project.createdBy?._id || this.project.createdBy;
    const userId = this.authService.getUser()?.id;
    return !!ownerId && !!userId && ownerId === userId;
  }

  confirmDelete(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Realmente deseja remover este projeto?',
      header: 'Remover Projeto',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.service.destroy(this.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Projeto removido!' });
            this.goBack();
          },
          error: (error: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error?.error?.message || 'Não foi possível remover o projeto.'
            });
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadProject(this.id);
      this.loadTasks(this.id);
      this.loadDocuments(this.id);
    }
    if (!this.isCustomerScoped) {
      this.loadCustomers();
    }
    this.loadStatuses();
  }

  loadDocuments(id: string): void {
    this.service.getDocuments(id).subscribe({
      next: (docs) => { this.documents = docs; },
      error: () => { this.documents = []; }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  loadCustomers(): void {
    this.customersService.findAll({ limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.customerOptions = records.map((c: any) => ({
          name: `${c.name} - ${c.phone}`,
          value: c._id
        }));
      }
    });
  }

  loadStatuses(): void {
    // Sem filtro de "somente ativos": mostra exatamente os mesmos status
    // cadastrados em Tickets > Configurações > Status.
    this.ticketStatusService.findAll().subscribe({
      next: (data) => {
        this.taskStatuses = data;
        this.statusOptions = data.map(s => ({ label: s.label, value: s._id }));
        this.buildTaskColumns();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro ao carregar status de tickets' });
      }
    });
  }

  get filteredTasks(): any[] {
    const term = this.tasksSearch.trim().toLowerCase();
    if (!term) return this.tasks;
    return this.tasks.filter(task =>
      task.taskNumber?.toLowerCase().includes(term) ||
      task.contactName?.toLowerCase().includes(term) ||
      task.contactNumber?.toLowerCase().includes(term) ||
      task.subjectId?.name?.toLowerCase().includes(term) ||
      task.assignedTo?.name?.toLowerCase().includes(term)
    );
  }

  private getTaskStatusId(task: any): string {
    return task.statusId?._id || task.statusId;
  }

  buildTaskColumns(): void {
    const filtered = this.filteredTasks;
    this.taskColumns = this.taskStatuses.map(status => ({
      status,
      tasks: filtered.filter(task => this.getTaskStatusId(task) === status._id)
    }));
  }

  onTasksSearchChange(): void {
    this.buildTaskColumns();
  }

  setTasksViewMode(mode: 'list' | 'kanban'): void {
    this.tasksViewMode = mode;
    if (mode === 'kanban') this.buildTaskColumns();
  }

  dropTask(event: CdkDragDrop<any[]>, targetStatus: any): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    const previousStatusId = this.getTaskStatusId(task);
    task.statusId = targetStatus;

    this.ticketService.updateStatus(task._id, targetStatus._id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Tarefa movida para "${targetStatus.label}"` });
      },
      error: () => {
        task.statusId = previousStatusId;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível mover a tarefa.' });
        this.buildTaskColumns();
      }
    });
  }

  loadProject(id: string): void {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (project) => {
        this.project = project;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar projeto' });
      }
    });
  }

  loadTasks(id: string): void {
    this.tasksLoading = true;
    this.service.getTasks(id).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.tasksLoading = false;
        this.buildTaskColumns();
      },
      error: () => {
        this.tasksLoading = false;
      }
    });
  }

  refresh(): void {
    if (!this.id) return;
    this.loadProject(this.id);
    this.loadTasks(this.id);
  }

  openTaskDialog(): void {
    const projectCustomerId = this.project?.customerId?._id ?? this.project?.customerId ?? '';
    if (this.isCustomerScoped && projectCustomerId && !this.customerOptions.length) {
      // Login de cliente não lista clientes; usa o próprio cliente do projeto
      // (já populado) só para exibir o nome no campo desabilitado.
      const c = this.project.customerId;
      this.customerOptions = [{ name: `${c?.name} - ${c?.phone}`, value: projectCustomerId }];
    }
    this.taskForm = {
      customerId: projectCustomerId,
      priority: 'medium',
      statusId: '',
      notes: '',
      startDate: undefined,
      endDate: undefined
    };
    this.taskDialog = true;
  }

  // O cliente da tarefa é sempre o mesmo do projeto; só fica editável quando
  // o projeto não tem cliente vinculado (projeto sem cliente é permitido).
  get isTaskCustomerLocked(): boolean {
    return !!(this.project?.customerId?._id ?? this.project?.customerId);
  }

  saveTask(): void {
    if (!this.taskForm.customerId) {
      this.messageService.add({ severity: 'warn', summary: 'Selecione um cliente' });
      return;
    }
    this.taskLoading = true;
    const payload: any = { ...this.taskForm, projectId: this.id };
    if (!payload.statusId) delete payload.statusId;
    this.ticketService.create(payload).subscribe({
      next: () => {
        this.taskDialog = false;
        this.taskLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Tarefa criada com sucesso' });
        this.refresh();
      },
      error: () => {
        this.taskLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao criar tarefa' });
      }
    });
  }

  openTask(task: any): void {
    this.router.navigate(['/tickets', task._id, 'attend']);
  }

  edit(): void {
    this.router.navigate(['/projects', this.id, 'edit']);
  }

  exportExcel(): void {
    if (!this.id) return;
    this.exporting = true;
    this.service.exportExcel(this.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.project?.projectNumber || 'projeto'}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível gerar o Excel.' });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  getPriorityLabel(priority: ProjectPriority): string {
    return ProjectPriorityLabels[priority] ?? priority;
  }

  getPrioritySeverity(priority: ProjectPriority): string {
    return ProjectPrioritySeverity[priority] ?? 'info';
  }

  getTaskPriorityLabel(priority: string): string {
    const map: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };
    return map[priority] || priority;
  }

  getTaskPrioritySeverity(priority: string): string {
    const map: Record<string, string> = { low: 'success', medium: 'info', high: 'warning', urgent: 'danger' };
    return map[priority] || 'secondary';
  }
}
