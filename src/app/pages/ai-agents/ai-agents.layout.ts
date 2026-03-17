import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { AiAgentListComponent } from './components/list/list.component';
import { AiAgent } from './ai-agent.interface';
import { AiAgentService } from './services/ai-agent.service';

@Component({
  selector: 'app-ai-agents-layout',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, SelectModule, ToastModule, BreadcrumbModule,
    SidebarComponent, AiAgentListComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <app-sidebar />

    <div class="ml-[280px] p-6 min-h-screen bg-surface-50 dark:bg-surface-900">
      <p-breadcrumb [home]="breadcrumbHome" [model]="breadcrumbItems" styleClass="mb-4" />

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100">Agentes IA</h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Gerencie seus agentes especializados de inteligência artificial
          </p>
        </div>
        <p-button
          label="Novo Agente"
          icon="pi pi-plus"
          (onClick)="goToNew()"
        />
      </div>

      <!-- Filtros -->
      <div class="flex gap-3 mb-5">
        <p-select
          [(ngModel)]="filterTipo"
          [options]="tipoFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos os tipos"
          (onChange)="loadAgents()"
          styleClass="w-48"
        />
        <p-select
          [(ngModel)]="filterStatus"
          [options]="statusFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos os status"
          (onChange)="loadAgents()"
          styleClass="w-44"
        />
      </div>

      <!-- Módulos disponíveis (cards informativos) -->
      @if (!loading && agents.length === 0) {
        <div class="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (mod of moduleCards; track mod.tipo) {
            <div class="bg-white dark:bg-surface-800 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-600 p-5 flex flex-col gap-2 text-center cursor-pointer hover:border-primary transition-colors"
              (click)="goToNewWithType(mod.tipo)"
            >
              <i [class]="'pi ' + mod.icon + ' text-3xl text-primary'"></i>
              <h3 class="font-semibold text-surface-700 dark:text-surface-200 text-sm">{{ mod.label }}</h3>
              <p class="text-xs text-surface-400">{{ mod.desc }}</p>
              <p class="text-xs font-medium text-primary mt-1">+ Criar agente</p>
            </div>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading) {
        <div class="flex justify-center py-16">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
      }

      <!-- Lista -->
      @if (!loading && agents.length > 0) {
        <app-ai-agent-list
          [agents]="agents"
          (agentDeleted)="onAgentDeleted($event)"
          (agentToggled)="onAgentToggled($event)"
        />
      }

      <!-- Empty state com agentes existentes mas filtro ativo -->
      @if (!loading && agents.length === 0 && (filterTipo || filterStatus)) {
        <div class="text-center py-12 text-surface-400">
          <i class="pi pi-filter-slash text-4xl mb-3"></i>
          <p>Nenhum agente encontrado com esses filtros</p>
          <p-button label="Limpar filtros" severity="secondary" [text]="true" (onClick)="clearFilters()" styleClass="mt-2" />
        </div>
      }
    </div>
  `
})
export class AiAgentsLayout implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'IA' }, { label: 'Agentes' }];

  agents: AiAgent[] = [];
  loading = false;

  filterTipo = '';
  filterStatus = '';

  tipoFilterOptions = [
    { label: 'Todos os tipos', value: '' },
    { label: 'Atendimento', value: 'atendimento' },
    { label: 'Vendas', value: 'vendas' },
    { label: 'Campanhas', value: 'campanhas' },
    { label: 'Análise de Leads', value: 'analise_leads' }
  ];

  statusFilterOptions = [
    { label: 'Todos os status', value: '' },
    { label: 'Ativos', value: 'ativo' },
    { label: 'Inativos', value: 'inativo' }
  ];

  moduleCards = [
    { tipo: 'atendimento', label: 'Atendimento', icon: 'pi-headphones', desc: 'Responde clientes automaticamente' },
    { tipo: 'vendas', label: 'Vendas', icon: 'pi-dollar', desc: 'Conduz conversa até o pagamento' },
    { tipo: 'campanhas', label: 'Campanhas', icon: 'pi-megaphone', desc: 'Gera textos e anúncios' },
    { tipo: 'analise_leads', label: 'Análise de Leads', icon: 'pi-chart-bar', desc: 'Classifica leads e sugere ações' }
  ];

  constructor(
    private router: Router,
    private aiAgentService: AiAgentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.loading = true;
    this.aiAgentService.list(this.filterTipo || undefined, this.filterStatus || undefined).subscribe({
      next: (agents) => {
        this.agents = agents;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar agentes' });
        this.loading = false;
      }
    });
  }

  goToNew(): void {
    this.router.navigate(['/ai-agents/new']);
  }

  goToNewWithType(tipo: string): void {
    this.router.navigate(['/ai-agents/new'], { queryParams: { tipo } });
  }

  clearFilters(): void {
    this.filterTipo = '';
    this.filterStatus = '';
    this.loadAgents();
  }

  onAgentDeleted(id: string): void {
    this.agents = this.agents.filter(a => a._id !== id);
  }

  onAgentToggled(updated: AiAgent): void {
    const idx = this.agents.findIndex(a => a._id === updated._id);
    if (idx !== -1) this.agents[idx] = updated;
  }
}
