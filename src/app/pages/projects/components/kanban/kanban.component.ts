import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, MenuItem } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProjectsService } from '../services/projects.service';
import { ProjectStatusService } from '../services/project-status.service';
import { ProjectPriority, ProjectPriorityLabels, ProjectPrioritySeverity } from '../../project.interface';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

interface KanbanColumn {
  status: any;
  projects: any[];
}

@Component({
  selector: 'app-projects-kanban',
  standalone: true,
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    Toast,
    BreadcrumbModule,
    TooltipModule,
    PaginatorModule,
    SidebarComponent
  ]
})
export class ProjectsKanbanComponent implements OnInit {
  public items: any[] = [];
  public statuses: any[] = [];
  public columns: KanbanColumn[] = [];
  public loading = false;
  public search = '';

  public first = 0;
  public rows = 10;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Projetos', routerLink: '/projects' }, { label: 'Kanban' }];

  constructor(
    private projectsService: ProjectsService,
    private statusService: ProjectStatusService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  public loadData() {
    this.loading = true;
    this.statusService.findAll(true).subscribe({
      next: (statuses) => {
        this.statuses = statuses;
        this.projectsService.findAll().subscribe({
          next: (resp: any) => {
            this.items = resp.records ?? resp;
            this.loading = false;
            this.buildColumns();
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
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

  get pagedItems(): any[] {
    return this.filteredItems.slice(this.first, this.first + this.rows);
  }

  private getStatusId(item: any): string {
    return item.statusId?._id || item.statusId;
  }

  public buildColumns() {
    const paged = this.pagedItems;
    this.columns = this.statuses.map(status => ({
      status,
      projects: paged.filter(item => this.getStatusId(item) === status._id)
    }));
  }

  public onSearchChange() {
    this.first = 0;
    this.buildColumns();
  }

  public onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.buildColumns();
  }

  public drop(event: CdkDragDrop<any[]>, targetStatus: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const project = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    const previousStatusId = this.getStatusId(project);
    project.statusId = targetStatus;

    this.projectsService.update(project._id, { statusId: targetStatus._id }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Projeto movido para "${targetStatus.label}"` });
      },
      error: () => {
        project.statusId = previousStatusId;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível mover o projeto.' });
        this.buildColumns();
      }
    });
  }

  public view(id: string) {
    this.router.navigate(['/projects', id]);
  }

  public goToList() {
    this.router.navigate(['/projects/list']);
  }

  public getCustomerName(item: any): string {
    return item.customerId?.name ?? '—';
  }

  public getPriorityLabel(priority: ProjectPriority): string {
    return ProjectPriorityLabels[priority] ?? priority;
  }

  public getPriorityColor(priority: ProjectPriority): string {
    return ProjectPrioritySeverity[priority] ?? 'info';
  }
}
