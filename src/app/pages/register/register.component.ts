import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CompanyService, RegisterCompanyRequest } from '../../services/company.service';
import { ModuleService, ModuleDef } from '../../services/module.service';
import { ModuleCode } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    TagModule,
    ToastModule
  ]
})
export class RegisterComponent implements OnInit {
  step = 1;
  loading = false;
  loadingModules = false;
  submitting = false;

  modules: ModuleDef[] = [];
  selectedCodes: ModuleCode[] = [];

  company = {
    name: '',
    documentType: 'cnpj' as 'cpf' | 'cnpj',
    document: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  };

  owner = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  showPassword = false;

  constructor(
    private companyService: CompanyService,
    private moduleService: ModuleService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.loadingModules = true;
    this.moduleService.findAll(true).subscribe({
      next: (mods) => {
        this.modules = mods;
        this.loadingModules = false;
      },
      error: () => {
        this.loadingModules = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar os módulos disponíveis'
        });
      }
    });
  }

  isSelected(code: ModuleCode): boolean {
    return this.selectedCodes.includes(code);
  }

  toggleModule(mod: ModuleDef): void {
    const code = mod.code;
    if (this.isSelected(code)) {
      this.selectedCodes = this.selectedCodes.filter(c => c !== code);
      // remove dependents that depended on this code
      this.modules.forEach(m => {
        if (m.requires?.includes(code) && this.isSelected(m.code)) {
          this.selectedCodes = this.selectedCodes.filter(c => c !== m.code);
        }
      });
    } else {
      // auto-add prerequisites
      (mod.requires || []).forEach(req => {
        if (!this.isSelected(req)) this.selectedCodes.push(req);
      });
      this.selectedCodes.push(code);
    }
  }

  getRequiresLabel(mod: ModuleDef): string | null {
    if (!mod.requires?.length) return null;
    const names = mod.requires
      .map(code => this.modules.find(m => m.code === code)?.name || code)
      .join(', ');
    return `Requer: ${names}`;
  }

  // ─── Validation per step ───────────────────────────────────────────────

  validateCompanyStep(): boolean {
    if (!this.company.name.trim()) {
      this.toastError('Informe o nome da empresa');
      return false;
    }
    if (!this.company.email.trim()) {
      this.toastError('Informe o e-mail da empresa');
      return false;
    }
    return true;
  }

  validateModulesStep(): boolean {
    if (this.selectedCodes.length === 0) {
      this.toastError('Selecione pelo menos um módulo');
      return false;
    }
    return true;
  }

  validateOwnerStep(): boolean {
    if (!this.owner.name.trim()) {
      this.toastError('Informe o nome do responsável');
      return false;
    }
    if (!this.owner.email.trim()) {
      this.toastError('Informe o e-mail do responsável');
      return false;
    }
    if (!this.owner.password || this.owner.password.length < 6) {
      this.toastError('Senha precisa ter pelo menos 6 caracteres');
      return false;
    }
    if (this.owner.password !== this.owner.confirmPassword) {
      this.toastError('Senhas não conferem');
      return false;
    }
    return true;
  }

  // ─── Step navigation ───────────────────────────────────────────────────

  nextStep(): void {
    if (this.step === 1 && !this.validateCompanyStep()) return;
    if (this.step === 2 && !this.validateModulesStep()) return;
    if (this.step === 3 && !this.validateOwnerStep()) return;
    if (this.step < 4) this.step += 1;
  }

  prevStep(): void {
    if (this.step > 1) this.step -= 1;
  }

  // ─── Submit ────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.validateCompanyStep()) { this.step = 1; return; }
    if (!this.validateModulesStep()) { this.step = 2; return; }
    if (!this.validateOwnerStep()) { this.step = 3; return; }

    const payload: RegisterCompanyRequest = {
      company: {
        name: this.company.name.trim(),
        email: this.company.email.trim().toLowerCase(),
        phone: this.company.phone || undefined,
        document: this.company.document || undefined,
        documentType: this.company.documentType,
        address: this.hasAnyAddressField() ? this.company.address : undefined
      },
      owner: {
        name: this.owner.name.trim(),
        email: this.owner.email.trim().toLowerCase(),
        password: this.owner.password
      },
      modules: this.selectedCodes
    };

    this.submitting = true;
    this.companyService.register(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cadastro realizado',
          detail: 'Empresa cadastrada. Aguardando ativação do pagamento.',
          life: 4000
        });
        setTimeout(() => this.router.navigate(['/login'], {
          queryParams: { registered: '1' }
        }), 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.toastError(err?.error?.message || 'Erro ao cadastrar empresa');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  private hasAnyAddressField(): boolean {
    return Object.values(this.company.address).some(v => !!(v && String(v).trim()));
  }

  private toastError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }

  selectedModuleSummary(): { code: ModuleCode; name: string; price: number }[] {
    return this.selectedCodes
      .map(code => {
        const mod = this.modules.find(m => m.code === code);
        return mod ? { code, name: mod.name, price: mod.price ?? 0 } : null;
      })
      .filter(Boolean) as { code: ModuleCode; name: string; price: number }[];
  }
}
