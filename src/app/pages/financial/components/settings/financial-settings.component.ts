import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Toast } from 'primeng/toast';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { AuthService } from '../../../../services/auth.service';
import { CompanyService, Company, CompanyReceivingInfo } from '../../../../services/company.service';

/**
 * Financeiro › Configurações.
 * Reúne os dados de recebimento (conta bancária + chave PIX, exibidos na fatura
 * impressa) e o atalho para a Integração Itaú (emissão de boletos).
 */
@Component({
  selector: 'app-financial-settings',
  standalone: true,
  templateUrl: './financial-settings.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    BreadcrumbModule,
    Toast,
    SidebarComponent
  ]
})
export class FinancialSettingsComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Configurações' }
  ];

  loading = false;
  saving = false;
  company: Company | null = null;
  receiving: CompanyReceivingInfo = {};

  itauEnabled = false;

  accountTypeOptions = [
    { label: 'Conta corrente', value: 'corrente' },
    { label: 'Conta poupança', value: 'poupanca' }
  ];
  pixKeyTypeOptions = [
    { label: 'CNPJ', value: 'cnpj' },
    { label: 'CPF', value: 'cpf' },
    { label: 'E-mail', value: 'email' },
    { label: 'Telefone', value: 'telefone' },
    { label: 'Aleatória', value: 'aleatoria' }
  ];

  constructor(
    private auth: AuthService,
    private companyService: CompanyService,
    private messageService: MessageService
  ) {
    this.itauEnabled = this.auth.hasModule('itau_integration');
  }

  ngOnInit(): void {
    const companyId = this.auth.getCompanyId();
    if (!companyId) {
      this.messageService.add({ severity: 'warn', summary: 'Sem empresa', detail: 'Sua conta não está vinculada a uma empresa.' });
      return;
    }
    this.loading = true;
    this.companyService.findById(companyId).subscribe({
      next: (c) => {
        this.company = c;
        this.receiving = { ...(c.receiving || {}) };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar as configurações' });
      }
    });
  }

  save(): void {
    if (!this.company) return;
    this.saving = true;
    this.companyService.update(this.company._id, { receiving: this.receiving }).subscribe({
      next: (c) => {
        this.company = c;
        this.receiving = { ...(c.receiving || {}) };
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Dados de recebimento salvos' });
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao salvar' });
      }
    });
  }
}
