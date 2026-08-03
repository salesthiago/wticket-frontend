import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ProjectsService } from '../services/projects.service';
import { ProjectPriority, ProjectPriorityLabels, ProjectPrioritySeverity } from '../../project.interface';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    ConfirmDialog,
    Toast,
    TagModule,
    DatePipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule,
    TooltipModule
  ]
})
export class ProjectsListComponent implements OnInit {
  public items: any[] = [];
  public loading = false;
  public search = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Projetos' }];

  constructor(
    private service: ProjectsService,
    private authService: AuthService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  // Acesso de cliente (portal restrito): pode criar projeto amarrado a si
  // mesmo, mas não gerencia configurações (Status).
  get isCustomerScoped(): boolean {
    return this.authService.isCustomerScoped();
  }

  // Exclusão só é permitida para quem criou o projeto ou para administradores.
  public canDelete(item: any): boolean {
    if (this.authService.hasAnyRole('administrator', 'company_admin')) return true;
    const ownerId = item.createdBy?._id || item.createdBy;
    const userId = this.authService.getUser()?.id;
    return !!ownerId && !!userId && ownerId === userId;
  }

  ngOnInit() {
    this.loadData();
  }

  public loadData() {
    this.loading = true;
    this.service.findAll().subscribe({
      next: (resp: any) => {
        this.items = resp.records ?? resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredItems(): any[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.items;
    return this.items.filter(item =>
      item.title?.toLowerCase().includes(term) ||
      item.projectNumber?.toLowerCase().includes(term) ||
      item.customerId?.name?.toLowerCase().includes(term)
    );
  }

  public add() {
    this.router.navigate(['/projects/create']);
  }

  public view(id: string) {
    this.router.navigate(['/projects', id]);
  }

  public edit(id: string) {
    this.router.navigate(['/projects', id, 'edit']);
  }

  public openSettings() {
    this.router.navigate(['/projects/settings']);
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja remover este projeto?',
      header: 'Remover Projeto',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.service.destroy(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Projeto removido!' });
            this.loadData();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover o projeto.' });
          }
        });
      }
    });
  }

  public getCustomerName(item: any): string {
    return item.customerId?.name ?? '—';
  }

  public getStatusLabel(item: any): string {
    return item.statusId?.label ?? '—';
  }

  public getStatusColor(item: any): string {
    return item.statusId?.color ?? '#6c757d';
  }

  public getPriorityLabel(priority: ProjectPriority): string {
    return ProjectPriorityLabels[priority] ?? priority;
  }

  public getPriorityColor(priority: ProjectPriority): string {
    return ProjectPrioritySeverity[priority] ?? 'info';
  }
}
