import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { LeadsService } from '../services/leads.service';
import { LeadStatus, LeadStatusLabels, LeadStatusColors } from '../../lead.interface';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  templateUrl: './list.component.html',
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
    TooltipModule,
    DatePipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class LeadsListComponent implements OnDestroy {
  public items: any[] = [];
  public total = 0;
  public loading = false;
  public search = '';
  public filterStatus = '';
  public rows = 10;
  private page = 1;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Leads' }];

  public optionStatus = [
    { name: 'Todos', value: '' },
    ...Object.entries(LeadStatusLabels).map(([value, name]) => ({ name, value }))
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private service: LeadsService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => this.reload());
  }

  public onLazyLoad(event: TableLazyLoadEvent) {
    this.rows = event.rows ?? this.rows;
    this.page = Math.floor((event.first ?? 0) / this.rows) + 1;
    this.loadData();
  }

  public loadData() {
    this.loading = true;
    const params: any = { page: this.page, limit: this.rows };
    if (this.search.trim()) params.search = this.search.trim();
    if (this.filterStatus) params.status = this.filterStatus;

    this.service.findAll(params).subscribe({
      next: (resp: any) => {
        this.items = resp.records ?? resp;
        this.total = resp.total ?? this.items.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private reload() {
    this.page = 1;
    this.loadData();
  }

  public onSearch() {
    const term = this.search.trim();
    if (term.length === 1) return;
    this.searchSubject.next(term);
  }

  public onFilterChange() {
    this.reload();
  }

  public clearSearch() {
    this.search = '';
    this.reload();
  }

  public add() {
    this.router.navigate(['/leads/create']);
  }

  public edit(id: string) {
    this.router.navigate(['/leads/edit/' + id]);
  }

  public openIntegration() {
    this.router.navigate(['/leads/integration']);
  }

  public createQuote(id: string) {
    this.router.navigate(['/service-orders/create'], { queryParams: { leadId: id } });
  }

  public confirmConvert(lead: any) {
    this.confirmationService.confirm({
      message: `Converter "${lead.name}" em cliente agora? Normalmente isso acontece sozinho quando o orçamento é aprovado.`,
      header: 'Converter em Cliente',
      icon: 'pi pi-user-plus',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { label: 'Converter' },
      accept: () => {
        this.service.convert(lead._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lead convertido em cliente!' });
            this.loadData();
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Não foi possível converter o lead.' });
          }
        });
      }
    });
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja remover este lead?',
      header: 'Remover Lead',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.service.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lead removido!' });
            this.loadData();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover o lead.' });
          }
        });
      }
    });
  }

  public getStatusLabel(status: LeadStatus): string {
    return LeadStatusLabels[status] ?? status;
  }

  public getStatusColor(status: LeadStatus): string {
    return LeadStatusColors[status] ?? 'info';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
