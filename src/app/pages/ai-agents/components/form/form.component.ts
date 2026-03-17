import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { AiAgent, AiAgentTipo, AiAgentTom, DadosProduto } from '../../ai-agent.interface';
import { AiAgentService } from '../../services/ai-agent.service';

@Component({
  selector: 'app-ai-agent-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, CardModule, InputTextModule,
    TextareaModule, SelectModule, TagModule, ToastModule, BreadcrumbModule,
    ChipModule, DividerModule, SidebarComponent
  ],
  providers: [MessageService],
  templateUrl: './form.component.html'
})
export class AiAgentFormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'IA', routerLink: '/ai-agents' }, { label: 'Agente' }];

  isEdit = false;
  agentId: string | null = null;
  isSaving = false;
  loading = false;

  // Nova regra sendo digitada
  novaRegra = '';
  // Novo benefício sendo digitado
  novoBeneficio = '';

  agent: Partial<AiAgent> = {
    nome: '',
    descricao: '',
    tipo: 'atendimento',
    tom: 'profissional',
    regras: [],
    status: 'ativo',
    dados_produto: null
  };

  tipoOptions = [
    { label: 'Atendimento ao Cliente', value: 'atendimento', icon: 'pi-headphones', desc: 'Responde clientes automaticamente' },
    { label: 'Vendas', value: 'vendas', icon: 'pi-dollar', desc: 'Conduz conversa até o pagamento' },
    { label: 'Campanhas', value: 'campanhas', icon: 'pi-megaphone', desc: 'Gera textos de anúncios e mensagens' },
    { label: 'Análise de Leads', value: 'analise_leads', icon: 'pi-chart-bar', desc: 'Classifica leads e sugere ações' }
  ];

  tomOptions = [
    { label: 'Profissional', value: 'profissional' },
    { label: 'Formal', value: 'formal' },
    { label: 'Informal', value: 'informal' },
    { label: 'Persuasivo', value: 'persuasivo' },
    { label: 'Amigável', value: 'amigavel' },
    { label: 'Empático', value: 'empático' },
    { label: 'Neutro', value: 'neutro' }
  ];

  statusOptions = [
    { label: 'Ativo', value: 'ativo' },
    { label: 'Inativo', value: 'inativo' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aiAgentService: AiAgentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.agentId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.agentId;

    if (this.isEdit) {
      this.breadcrumbItems = [{ label: 'IA', routerLink: '/ai-agents' }, { label: 'Editar Agente' }];
      this.loadAgent();
    } else {
      this.breadcrumbItems = [{ label: 'IA', routerLink: '/ai-agents' }, { label: 'Novo Agente' }];
    }
  }

  loadAgent(): void {
    this.loading = true;
    this.aiAgentService.get(this.agentId!).subscribe({
      next: (agent) => {
        this.agent = {
          ...agent,
          regras: agent.regras || [],
          dados_produto: agent.dados_produto || null
        };
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar agente' });
        this.loading = false;
        this.router.navigate(['/ai-agents']);
      }
    });
  }

  get showDadosProduto(): boolean {
    return this.agent.tipo === 'vendas' || this.agent.tipo === 'campanhas';
  }

  toggleDadosProduto(): void {
    if (this.agent.dados_produto) {
      this.agent.dados_produto = null;
    } else {
      this.agent.dados_produto = { nome: '', preco: '', beneficios: [] };
    }
  }

  addRegra(): void {
    if (!this.novaRegra.trim()) return;
    this.agent.regras = [...(this.agent.regras || []), this.novaRegra.trim()];
    this.novaRegra = '';
  }

  removeRegra(index: number): void {
    this.agent.regras = (this.agent.regras || []).filter((_, i) => i !== index);
  }

  addBeneficio(): void {
    if (!this.novoBeneficio.trim()) return;
    if (!this.agent.dados_produto) return;
    this.agent.dados_produto.beneficios = [...(this.agent.dados_produto.beneficios || []), this.novoBeneficio.trim()];
    this.novoBeneficio = '';
  }

  removeBeneficio(index: number): void {
    if (!this.agent.dados_produto) return;
    this.agent.dados_produto.beneficios = (this.agent.dados_produto.beneficios || []).filter((_, i) => i !== index);
  }

  onKeyEnterRegra(event: Event): void {
    event.preventDefault();
    this.addRegra();
  }

  onKeyEnterBeneficio(event: Event): void {
    event.preventDefault();
    this.addBeneficio();
  }

  onSubmit(): void {
    if (!this.agent.nome || !this.agent.tipo) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome e tipo são obrigatórios' });
      return;
    }

    this.isSaving = true;

    const operation = this.isEdit
      ? this.aiAgentService.update(this.agentId!, this.agent)
      : this.aiAgentService.create(this.agent);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.isEdit ? 'Agente atualizado!' : 'Agente criado!'
        });
        this.isSaving = false;
        setTimeout(() => this.router.navigate(['/ai-agents']), 1000);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Erro ao salvar agente'
        });
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/ai-agents']);
  }
}
