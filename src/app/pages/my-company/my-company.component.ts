import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { AuthService, ModuleCode } from '../../services/auth.service';
import { CompanyService, Company } from '../../services/company.service';
import { ModuleService, ModuleDef } from '../../services/module.service';
import { StatusPipe } from 'src/app/shared/status-pipe';
import { StorageConfigComponent } from '../../components/storage-config/storage-config.component';

@Component({
  selector: 'app-my-company',
  standalone: true,
  templateUrl: './my-company.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TagModule,
    ToastModule,
    SidebarComponent,
    StatusPipe,
    StorageConfigComponent
  ]
})
export class MyCompanyComponent implements OnInit {
  loading = false;
  saving = false;
  company: Company | null = null;
  catalog: ModuleDef[] = [];

  // Só super_admin OU company_admin/administrator da própria empresa podem
  // editar a configuração de storage (gating idêntico ao do backend).
  canManageStorage = false;

  constructor(
    private auth: AuthService,
    private companyService: CompanyService,
    private moduleService: ModuleService,
    private messageService: MessageService
  ) {
    this.canManageStorage = this.auth.hasAnyRole('company_admin', 'administrator');
  }

  ngOnInit(): void {
    const companyId = this.auth.getCompanyId();
    if (!companyId) {
      this.messageService.add({ severity: 'warn', summary: 'Sem empresa', detail: 'Sua conta não está vinculada a uma empresa.' });
      return;
    }
    this.loading = true;
    this.moduleService.findAll(true).subscribe(m => this.catalog = m);
    this.companyService.findById(companyId).subscribe({
      next: (c) => { this.company = c; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresa' }); }
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
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Dados atualizados' });
      },
      error: (err) => { this.saving = false; this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha' }); }
    });
  }

  moduleName(code: ModuleCode): string {
    return this.catalog.find(m => m.code === code)?.name || code;
  }
}
