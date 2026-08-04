import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProjectsService } from '../services/projects.service';
import { ProjectStatusService } from '../services/project-status.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import { ProjectModel, ProjectDocumentModel } from '../../project.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    InputNumberModule,
    Toast,
    ConfirmDialogModule,
    TooltipModule,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class ProjectFormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [];

  public project: ProjectModel = {
    title: '',
    description: '',
    priority: 'medium',
    hourlyRate: 0
  };

  public loading = false;
  public customers: any[] = [];
  public statuses: any[] = [];
  public documents: ProjectDocumentModel[] = [];
  public uploadingDocument = false;

  public optionPriority = [
    { name: 'Baixa', value: 'low' },
    { name: 'Média', value: 'medium' },
    { name: 'Alta', value: 'high' },
    { name: 'Urgente', value: 'urgent' }
  ];

  protected id: string | null = null;

  constructor(
    private service: ProjectsService,
    private statusService: ProjectStatusService,
    private customersService: CustomersService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  // Acesso de cliente (portal restrito): cria o projeto amarrado a si mesmo
  // (o backend força isso); não lista clientes (a API bloqueia) e nem precisa.
  get isCustomerScoped(): boolean {
    return this.authService.isCustomerScoped();
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Projetos', routerLink: '/projects' },
      { label: this.id ? 'Editar Projeto' : 'Novo Projeto' }
    ];

    if (!this.isCustomerScoped) {
      this.loadCustomers();
    }
    this.loadStatuses();

    if (this.id) {
      this.findById(this.id);
      this.loadDocuments(this.id);
    }
  }

  private loadDocuments(id: string) {
    this.service.getDocuments(id).subscribe({
      next: (docs) => { this.documents = docs; },
      error: () => { this.documents = []; }
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.id) return;
    const file = input.files[0];
    this.uploadingDocument = true;
    this.service.addDocument(this.id, file).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.uploadingDocument = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento anexado!' });
        input.value = '';
      },
      error: (error: any) => {
        this.uploadingDocument = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao enviar documento'
        });
        input.value = '';
      }
    });
  }

  public confirmDeleteDocument(event: Event, documentId: string): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Remover este documento?',
      header: 'Remover Documento',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Remover', severity: 'danger' },
      accept: () => {
        this.service.deleteDocument(this.id!, documentId).subscribe({
          next: (docs) => {
            this.documents = docs;
            this.messageService.add({ severity: 'success', summary: 'Documento removido' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro ao remover documento' });
          }
        });
      }
    });
  }

  public formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadCustomers() {
    this.customersService.findAll({ limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.customers = records.map((c: any) => ({
          name: `${c.name} - ${c.phone}`,
          value: c._id
        }));
      }
    });
  }

  private loadStatuses() {
    this.statusService.findAll(true).subscribe({
      next: (data) => {
        this.statuses = data.map(s => ({ name: s.label, value: s._id }));
      }
    });
  }

  private findById(id: string) {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.project = {
          ...resp,
          statusId: resp.statusId?._id ?? resp.statusId ?? '',
          customerId: resp.customerId?._id ?? resp.customerId ?? '',
          startDate: resp.startDate ? new Date(resp.startDate) : undefined,
          endDate: resp.endDate ? new Date(resp.endDate) : undefined
        };
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao buscar projeto'
        });
      }
    });
  }

  public onSubmit(): void {
    if (!this.project.title || this.project.title.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe o título do projeto' });
      return;
    }

    this.loading = true;

    const payload: any = {
      title: this.project.title,
      description: this.project.description,
      priority: this.project.priority,
      startDate: this.project.startDate,
      endDate: this.project.endDate,
      hourlyRate: this.project.hourlyRate,
      customerId: this.project.customerId || null
    };

    if (this.project.statusId) {
      payload.statusId = this.project.statusId;
    }

    if (this.id) {
      this.service.update(this.id, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Projeto atualizado!' });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao atualizar projeto'
          });
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: (created: any) => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Projeto criado com sucesso!' });
          // Vai para a edição do projeto recém-criado, onde já é possível anexar documentos.
          this.router.navigate(['/projects', created._id, 'edit']);
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao criar projeto'
          });
        }
      });
    }
  }

  public onBack() {
    this.router.navigate(['/projects']);
  }
}
