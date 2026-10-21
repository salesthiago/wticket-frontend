import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { CompanyService, CompanyStatus } from '../../../services/company.service';
import { PlatformService } from '../services/platform.service';
import { BillingCompanyRow, BillingSituation, BillingSituationLabels, BillingSituationSeverity } from '../platform.interface';

const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada'
};

@Component({
  selector: 'app-platform-companies',
  standalone: true,
  templateUrl: './platform-companies.component.html',
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule, TableModule, TagModule, InputTextModule,
    IconFieldModule, InputIconModule, SelectModule, TooltipModule, ToastModule, ConfirmDialog, SidebarComponent
  ]
})
export class PlatformCompaniesComponent implements OnInit {
  companies: BillingCompanyRow[] = [];
  loading = false;
  search = '';
  statusFilter: CompanyStatus | '' = '';

  statusOptions = [
    { value: '', label: 'Todos os status' },
    ...Object.entries(COMPANY_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  ];

  constructor(
    private platformService: PlatformService,
    private companyService: CompanyService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.platformService.getBillingOverview().subscribe({
      next: (data) => {
        this.companies = data.companies;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresas' });
      }
    });
  }

  get filtered(): BillingCompanyRow[] {
    const term = this.search.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    return this.companies.filter(c => {
      if (this.statusFilter && c.status !== this.statusFilter) return false;
      if (!term) return true;
      return c.name?.toLowerCase().includes(term)
        || c.email?.toLowerCase().includes(term)
        || (!!digits && (c.document || '').replace(/\D/g, '').includes(digits));
    });
  }

  get counts() {
    return {
      total: this.companies.length,
      active: this.companies.filter(c => c.status === 'active').length,
      pending: this.companies.filter(c => c.status === 'pending_payment').length,
      suspended: this.companies.filter(c => c.status === 'suspended').length
    };
  }

  open(c: BillingCompanyRow): void {
    this.router.navigate(['/admin/companies', c._id]);
  }

  setStatus(c: BillingCompanyRow, status: CompanyStatus): void {
    const apply = () => this.companyService.setStatus(c._id, status).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Status atualizado', detail: `${c.name}: ${this.statusLabel(status)}` });
        this.load();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao atualizar status' })
    });

    if (status === 'suspended') {
      this.confirmationService.confirm({
        header: 'Suspender empresa',
        message: `Suspender ${c.name}? Os usuários perdem o acesso até a reativação.`,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text' },
        acceptButtonProps: { label: 'Suspender', severity: 'danger' },
        accept: apply
      });
      return;
    }
    apply();
  }

  statusLabel(s: CompanyStatus): string {
    return COMPANY_STATUS_LABELS[s] ?? s;
  }

  statusSeverity(s: CompanyStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (s) {
      case 'active': return 'success';
      case 'pending_payment': return 'warn';
      case 'suspended': return 'danger';
      default: return 'secondary';
    }
  }

  situationLabel(s: BillingSituation): string {
    return BillingSituationLabels[s] ?? s;
  }

  situationSeverity(s: BillingSituation) {
    return BillingSituationSeverity[s] ?? 'secondary';
  }
}
