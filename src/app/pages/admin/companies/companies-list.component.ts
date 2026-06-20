import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { CompanyService, Company, CompanyStatus } from '../../../services/company.service';

@Component({
  selector: 'app-admin-companies-list',
  standalone: true,
  templateUrl: './companies-list.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    SidebarComponent
  ]
})
export class CompaniesListComponent implements OnInit {
  companies: Company[] = [];
  loading = false;
  search = '';
  statusFilter: CompanyStatus | '' = '';

  statusOptions: { value: CompanyStatus | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'pending_payment', label: 'Aguardando pagamento' },
    { value: 'active', label: 'Ativa' },
    { value: 'suspended', label: 'Suspensa' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.statusFilter) params.status = this.statusFilter;
    this.companyService.findAll(params).subscribe({
      next: (data) => {
        this.companies = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresas' });
      }
    });
  }

  edit(c: Company): void {
    this.router.navigate(['/admin/companies', c._id]);
  }

  activate(c: Company): void {
    this.companyService.setStatus(c._id, 'active').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Empresa ativada', detail: c.name });
        this.load();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha' })
    });
  }

  suspend(c: Company): void {
    this.companyService.setStatus(c._id, 'suspended').subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Empresa suspensa', detail: c.name });
        this.load();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha' })
    });
  }

  statusSeverity(s: CompanyStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (s) {
      case 'active': return 'success';
      case 'pending_payment': return 'warn';
      case 'suspended': return 'danger';
      default: return 'secondary';
    }
  }

  statusLabel(s: CompanyStatus): string {
    return this.statusOptions.find(o => o.value === s)?.label || s;
  }
}
