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
import { CompanyService, RegisterCompanyRequest, CheckoutResult } from '../../services/company.service';
import { PlanService, Plan, PlanCycle, CYCLE_LABELS } from '../../services/plan.service';
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
  loadingPlans = false;
  submitting = false;

  plans: Plan[] = [];
  modules: ModuleDef[] = [];
  selectedPlanId: string | null = null;

  // Estado pós-cadastro (etapa de pagamento, dentro do próprio /register)
  registered = false;
  checkout: CheckoutResult | null = null;
  checkoutError: string | null = null;
  redirecting = false;

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
    private planService: PlanService,
    private moduleService: ModuleService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.moduleService.findAll(true).subscribe(m => this.modules = m);
    this.loadPlans();
  }

  loadPlans(): void {
    this.loadingPlans = true;
    this.planService.findAll(true).subscribe({
      next: (plans) => {
        this.plans = plans;
        // Se houver apenas um plano, já vem pré-selecionado.
        if (plans.length === 1) this.selectedPlanId = plans[0]._id;
        this.loadingPlans = false;
      },
      error: () => {
        this.loadingPlans = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os planos disponíveis' });
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  get selectedPlan(): Plan | null {
    return this.plans.find(p => p._id === this.selectedPlanId) || null;
  }

  selectPlan(plan: Plan): void {
    this.selectedPlanId = plan._id;
  }

  isPlanSelected(plan: Plan): boolean {
    return this.selectedPlanId === plan._id;
  }

  moduleName(code: ModuleCode): string {
    return this.modules.find(m => m.code === code)?.name || code;
  }

  cycleLabel(cycle?: PlanCycle): string {
    return cycle ? CYCLE_LABELS[cycle] : CYCLE_LABELS['MONTHLY'];
  }

  // ─── Validation per step ───────────────────────────────────────────────

  validateCompanyStep(): boolean {
    if (!this.company.name.trim()) { this.toastError('Informe o nome da empresa'); return false; }
    if (!this.company.email.trim()) { this.toastError('Informe o e-mail da empresa'); return false; }
    return true;
  }

  validatePlanStep(): boolean {
    if (!this.selectedPlanId) { this.toastError('Selecione um plano'); return false; }
    return true;
  }

  validateOwnerStep(): boolean {
    if (!this.owner.name.trim()) { this.toastError('Informe o nome do responsável'); return false; }
    if (!this.owner.email.trim()) { this.toastError('Informe o e-mail do responsável'); return false; }
    if (!this.owner.password || this.owner.password.length < 6) { this.toastError('Senha precisa ter pelo menos 6 caracteres'); return false; }
    if (this.owner.password !== this.owner.confirmPassword) { this.toastError('Senhas não conferem'); return false; }
    return true;
  }

  // ─── Step navigation ───────────────────────────────────────────────────

  nextStep(): void {
    if (this.step === 1 && !this.validateCompanyStep()) return;
    if (this.step === 2 && !this.validatePlanStep()) return;
    if (this.step === 3 && !this.validateOwnerStep()) return;
    if (this.step < 4) this.step += 1;
  }

  prevStep(): void {
    if (this.step > 1) this.step -= 1;
  }

  // ─── Submit ────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.validateCompanyStep()) { this.step = 1; return; }
    if (!this.validatePlanStep()) { this.step = 2; return; }
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
      planId: this.selectedPlanId!
    };

    this.submitting = true;
    this.companyService.register(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.registered = true;
        this.checkout = res.checkout ?? null;
        this.checkoutError = res.checkoutError ?? null;
        this.messageService.add({
          severity: 'success',
          summary: 'Cadastro realizado',
          detail: 'Empresa cadastrada. Conclua o pagamento para liberar o acesso.',
          life: 4000
        });
      },
      error: (err) => {
        this.submitting = false;
        this.toastError(err?.error?.message || 'Erro ao cadastrar empresa');
      }
    });
  }

  // ─── Pagamento ──────────────────────────────────────────────────────────

  payNow(): void {
    if (!this.checkout?.url) return;
    this.redirecting = true;
    // Redireciona para o checkout hospedado da AbacatePay.
    window.location.href = this.checkout.url;
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { registered: '1' } });
  }

  private hasAnyAddressField(): boolean {
    return Object.values(this.company.address).some(v => !!(v && String(v).trim()));
  }

  private toastError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
}
