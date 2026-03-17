import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { AiAgent, ChatMessage, LeadAnalysis } from '../../ai-agent.interface';
import { AiAgentService } from '../../services/ai-agent.service';

@Component({
  selector: 'app-ai-agent-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, TextareaModule,
    CardModule, ToastModule, BreadcrumbModule, SelectModule, DividerModule,
    TagModule, SidebarComponent
  ],
  providers: [MessageService],
  templateUrl: './chat.component.html'
})
export class AiAgentChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'IA', routerLink: '/ai-agents' }, { label: 'Chat' }];

  agent: AiAgent | null = null;
  agentId = '';
  loading = false;
  sending = false;

  // Chat (atendimento/vendas)
  messages: ChatMessage[] = [];
  messageInput = '';
  conversationId: string | null = null;

  // Lead Analysis
  leadFields: { key: string; value: string }[] = [
    { key: 'nome', value: '' },
    { key: 'telefone', value: '' },
    { key: 'interesse', value: '' }
  ];
  novoLeadKey = '';
  novoLeadValue = '';
  leadResult: LeadAnalysis | null = null;
  analyzingLead = false;

  // Campanhas
  campaignParams = {
    canal: '',
    objetivo: '',
    publico: '',
    instrucoes: '',
    quantidade: 1
  };
  campaignResult = '';
  generatingCampaign = false;

  canalOptions = [
    { label: 'WhatsApp', value: 'WhatsApp' },
    { label: 'Instagram', value: 'Instagram' },
    { label: 'Facebook Ads', value: 'Facebook Ads' },
    { label: 'E-mail', value: 'E-mail' },
    { label: 'SMS', value: 'SMS' }
  ];

  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aiAgentService: AiAgentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.agentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAgent();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadAgent(): void {
    this.loading = true;
    this.aiAgentService.get(this.agentId).subscribe({
      next: (agent) => {
        this.agent = agent;
        this.breadcrumbItems = [
          { label: 'IA', routerLink: '/ai-agents' },
          { label: agent.nome }
        ];
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Agente não encontrado' });
        this.loading = false;
        this.router.navigate(['/ai-agents']);
      }
    });
  }

  // ─── Chat ────────────────────────────────────────────────────────────────

  sendMessage(): void {
    if (!this.messageInput.trim() || this.sending) return;

    const msg = this.messageInput.trim();
    this.messageInput = '';

    this.messages.push({ role: 'user', content: msg, timestamp: new Date() });
    this.shouldScrollToBottom = true;
    this.sending = true;

    this.aiAgentService.sendMessage(this.agentId, msg, this.conversationId || undefined).subscribe({
      next: (resp) => {
        this.conversationId = resp.conversationId;
        this.messages.push({ role: 'assistant', content: resp.text, timestamp: new Date() });
        this.shouldScrollToBottom = true;
        this.sending = false;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Erro ao enviar mensagem'
        });
        this.sending = false;
      }
    });
  }

  onKeyEnter(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (!kbEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.conversationId = null;
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  // ─── Análise de Lead ─────────────────────────────────────────────────────

  addLeadField(): void {
    if (!this.novoLeadKey.trim()) return;
    this.leadFields.push({ key: this.novoLeadKey.trim(), value: this.novoLeadValue.trim() });
    this.novoLeadKey = '';
    this.novoLeadValue = '';
  }

  removeLeadField(index: number): void {
    this.leadFields.splice(index, 1);
  }

  analyzeLead(): void {
    const leadData: Record<string, string> = {};
    this.leadFields.forEach(f => {
      if (f.key && f.value) leadData[f.key] = f.value;
    });

    if (Object.keys(leadData).length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha ao menos um campo do lead' });
      return;
    }

    this.analyzingLead = true;
    this.leadResult = null;

    this.aiAgentService.analyzeLead(this.agentId, leadData).subscribe({
      next: (result) => {
        this.leadResult = result;
        this.analyzingLead = false;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Erro ao analisar lead'
        });
        this.analyzingLead = false;
      }
    });
  }

  getLeadColor(classificacao: string): string {
    const map: Record<string, string> = { QUENTE: 'danger', MORNO: 'warn', FRIO: 'info' };
    return map[classificacao] || 'secondary';
  }

  // ─── Campanha ────────────────────────────────────────────────────────────

  generateCampaign(): void {
    if (!this.campaignParams.objetivo) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o objetivo da campanha' });
      return;
    }

    this.generatingCampaign = true;
    this.campaignResult = '';

    this.aiAgentService.generateCampaign(this.agentId, this.campaignParams).subscribe({
      next: (result) => {
        this.campaignResult = result.text;
        this.generatingCampaign = false;
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Erro ao gerar campanha'
        });
        this.generatingCampaign = false;
      }
    });
  }

  copyCampaign(): void {
    navigator.clipboard.writeText(this.campaignResult).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado!', detail: 'Texto copiado para a área de transferência' });
    });
  }

  get isChatType(): boolean {
    return this.agent?.tipo === 'atendimento' || this.agent?.tipo === 'vendas';
  }

  get isLeadType(): boolean {
    return this.agent?.tipo === 'analise_leads';
  }

  get isCampaignType(): boolean {
    return this.agent?.tipo === 'campanhas';
  }
}
