import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
import { MessageService, MenuItem } from 'primeng/api';
import { ProjectsService } from '../services/projects.service';
import { TicketService } from '../../../tickets/components/services/ticket.service';
import { TicketStatusService } from '../../../tickets/components/services/ticket-status.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import { ProjectPriority, ProjectPriorityLabels, ProjectPrioritySeverity } from '../../project.interface';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadProject(this.id);
      this.loadTasks(this.id);
    }
    this.loadCustomers();
    this.loadStatuses();
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
        this.statusOptions = data.map(s => ({ label: s.label, value: s._id }));
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro ao carregar status de tickets' });
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
