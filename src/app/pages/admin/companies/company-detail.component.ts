import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { CompanyService, Company, SubscriptionStatus } from '../../../services/company.service';
import { ModuleService, ModuleDef } from '../../../services/module.service';
import { ModuleCode } from '../../../services/auth.service';
import { StorageConfigComponent } from '../../../components/storage-config/storage-config.component';

@Component({
  selector: 'app-admin-company-detail',
  standalone: true,
  templateUrl: './company-detail.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SidebarComponent,
    StorageConfigComponent
  ]
})
export class CompanyDetailComponent implements OnInit {
  loading = false;
  saving = false;
  company: Company | null = null;
  catalog: ModuleDef[] = [];
  newModuleCode: ModuleCode | '' = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private moduleService: ModuleService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/companies']);
      return;
    }
    this.loading = true;
    this.moduleService.findAll(true).subscribe(mods => this.catalog = mods);
    this.companyService.findById(id).subscribe({
      next: (c) => { this.company = c; this.loading = false; },
      error: () => { this.loading = false; this.toastErr('Empresa não encontrada'); }
    });
  }

  save(): void {
    if (!this.company) return;
    this.saving = true;
    const { name, email, phone, document, documentType, address } = this.company;
    this.companyService.update(this.company._id, { name, email, phone, document, documentType, address }).subscribe({
      next: (c) => {
        this.company = c;
        this.saving = false;
        this.toastOk('Dados salvos');
      },
      error: (err) => { this.saving = false; this.toastErr(err?.error?.message || 'Falha ao salvar'); }
    });
  }

  hasModule(code: ModuleCode): boolean {
    return !!this.company?.modules.some(m => m.code === code);
  }

  availableToAdd(): ModuleDef[] {
    if (!this.company) return [];
    return this.catalog.filter(m => !this.hasModule(m.code));
  }

  addModule(): void {
    if (!this.company || !this.newModuleCode) return;
    this.companyService.addModule(this.company._id, { code: this.newModuleCode, subscriptionStatus: 'active', activatedAt: new Date().toISOString() })
      .subscribe({
        next: (c) => {
          this.company = c;
          this.newModuleCode = '';
          this.toastOk('Módulo adicionado');
        },
        error: (err) => this.toastErr(err?.error?.message || 'Falha ao adicionar módulo')
      });
  }

  removeModule(code: ModuleCode): void {
    if (!this.company) return;
    this.companyService.removeModule(this.company._id, code).subscribe({
      next: (c) => { this.company = c; this.toastOk('Módulo removido'); },
      error: (err) => this.toastErr(err?.error?.message || 'Falha ao remover módulo')
    });
  }

  setSubscription(code: ModuleCode, status: SubscriptionStatus): void {
    if (!this.company) return;
    this.companyService.setModuleSubscription(this.company._id, code, { subscriptionStatus: status, activatedAt: status === 'active' ? new Date().toISOString() : undefined })
      .subscribe({
        next: (c) => { this.company = c; this.toastOk(`Assinatura ${status}`); },
        error: (err) => this.toastErr(err?.error?.message || 'Falha')
      });
  }

  setCompanyStatus(status: 'active' | 'suspended' | 'cancelled' | 'pending_payment'): void {
    if (!this.company) return;
    this.companyService.setStatus(this.company._id, status).subscribe({
      next: (c) => { this.company = { ...this.company!, status: c.status }; this.toastOk(`Empresa: ${status}`); },
      error: (err) => this.toastErr(err?.error?.message || 'Falha')
    });
  }

  toggleExempt(): void {
    if (!this.company) return;
    const newExempt = !this.company.subscriptionExempt;
    this.companyService.setExempt(this.company._id, newExempt).subscribe({
      next: (c) => {
        this.company = { ...this.company!, subscriptionExempt: c.subscriptionExempt, status: c.status };
        this.toastOk(newExempt ? 'Empresa isenta de assinatura' : 'Isenção removida');
      },
      error: (err) => this.toastErr(err?.error?.message || 'Falha')
    });
  }

  back(): void { this.router.navigate(['/admin/companies']); }

  moduleName(code: ModuleCode): string {
    return this.catalog.find(m => m.code === code)?.name || code;
  }

  private toastOk(detail: string) { this.messageService.add({ severity: 'success', summary: 'OK', detail }); }
  private toastErr(detail: string) { this.messageService.add({ severity: 'error', summary: 'Erro', detail }); }
}
