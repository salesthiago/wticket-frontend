import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { PlanService, Plan, PlanCycle, CYCLE_LABELS } from '../../../services/plan.service';
import { ModuleService, ModuleDef } from '../../../services/module.service';
import { ModuleCode } from '../../../services/auth.service';

interface PlanDraft {
  name: string;
  description: string;
  moduleCodes: ModuleCode[];
  price: number;
  cycle: PlanCycle;
  trialDays: number;
  isActive: boolean;
}

function emptyDraft(): PlanDraft {
  return { name: '', description: '', moduleCodes: [], price: 0, cycle: 'MONTHLY', trialDays: 0, isActive: true };
}

@Component({
  selector: 'app-admin-plans-list',
  standalone: true,
  templateUrl: './plans-list.component.html',
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    DialogModule,
    CheckboxModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    SidebarComponent
  ]
})
export class PlansListComponent implements OnInit {
  plans: Plan[] = [];
  modules: ModuleDef[] = [];
  loading = false;

  dialogVisible = false;
  editingId: string | null = null;
  draft: PlanDraft = emptyDraft();
  saving = false;

  constructor(
    private planService: PlanService,
    private moduleService: ModuleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.moduleService.findAll(false).subscribe(m => this.modules = m);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.planService.findAll(false).subscribe({
      next: (p) => { this.plans = p; this.loading = false; },
      error: () => { this.loading = false; this.toastError('Falha ao carregar planos'); }
    });
  }

  moduleName(code: ModuleCode): string {
    return this.modules.find(m => m.code === code)?.name || code;
  }

  // ─── Form ────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.editingId = null;
    this.draft = emptyDraft();
    this.dialogVisible = true;
  }

  openEdit(plan: Plan): void {
    this.editingId = plan._id;
    this.draft = {
      name: plan.name,
      description: plan.description || '',
      moduleCodes: [...plan.moduleCodes],
      price: plan.price ?? 0,
      cycle: plan.cycle ?? 'MONTHLY',
      trialDays: plan.trialDays ?? 0,
      isActive: plan.isActive ?? true
    };
    this.dialogVisible = true;
  }

  cycleOptions: { value: PlanCycle; label: string }[] =
    (Object.keys(CYCLE_LABELS) as PlanCycle[]).map(value => ({ value, label: CYCLE_LABELS[value] }));

  cycleLabel(cycle?: PlanCycle): string {
    return cycle ? CYCLE_LABELS[cycle] : CYCLE_LABELS['MONTHLY'];
  }

  isModuleSelected(code: ModuleCode): boolean {
    return this.draft.moduleCodes.includes(code);
  }

  toggleModule(code: ModuleCode): void {
    if (this.isModuleSelected(code)) {
      this.draft.moduleCodes = this.draft.moduleCodes.filter(c => c !== code);
    } else {
      this.draft.moduleCodes = [...this.draft.moduleCodes, code];
    }
  }

  /** Soma dos preços avulsos dos módulos selecionados — só uma referência ao montar o preço. */
  get modulesSumHint(): number {
    return this.draft.moduleCodes.reduce((sum, code) => {
      const mod = this.modules.find(m => m.code === code);
      return sum + (mod?.price ?? 0);
    }, 0);
  }

  save(): void {
    if (!this.draft.name.trim()) { this.toastError('Informe o nome do plano'); return; }
    if (this.draft.moduleCodes.length === 0) { this.toastError('Selecione ao menos um módulo'); return; }
    if (this.draft.price == null || this.draft.price < 0) { this.toastError('Preço inválido'); return; }

    const payload: Partial<Plan> = {
      name: this.draft.name.trim(),
      description: this.draft.description.trim() || undefined,
      moduleCodes: this.draft.moduleCodes,
      price: this.draft.price,
      cycle: this.draft.cycle,
      trialDays: this.draft.trialDays ?? 0,
      isActive: this.draft.isActive
    };

    this.saving = true;
    const req$ = this.editingId
      ? this.planService.update(this.editingId, payload)
      : this.planService.create(payload);

    req$.subscribe({
      next: (saved) => {
        if (saved?.abacateError) {
          this.messageService.add({ severity: 'warn', summary: 'AbacatePay', detail: `Plano salvo, mas a assinatura não sincronizou: ${saved.abacateError}`, life: 6000 });
        }
        this.saving = false;
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: this.editingId ? 'Plano atualizado' : 'Plano criado' });
        this.load();
      },
      error: (err) => { this.saving = false; this.toastError(err?.error?.message || 'Falha ao salvar plano'); }
    });
  }

  toggleActive(plan: Plan): void {
    this.planService.update(plan._id, { isActive: !plan.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.toastError(err?.error?.message || 'Falha')
    });
  }

  confirmDelete(plan: Plan): void {
    this.confirmationService.confirm({
      message: `Remover o plano "${plan.name}"? Empresas já cadastradas não são afetadas.`,
      header: 'Confirmar remoção',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.planService.delete(plan._id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Plano removido' }); this.load(); },
          error: (err) => this.toastError(err?.error?.message || 'Falha ao remover')
        });
      }
    });
  }

  private toastError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
}
