import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { AiProvidersService, AiProviderKey, ProviderConfig } from './services/ai-providers.service';

interface ProviderCard {
  key: AiProviderKey;
  label: string;
  logo: string;
  color: string;
  bgColor: string;
  borderColor: string;
  docsUrl: string;
  models: { label: string; value: string }[];
  tokenPlaceholder: string;
  // estado local
  config: { token: string; model: string; status: 'enabled' | 'disabled' };
  configured: boolean;
  showToken: boolean;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; text?: string; message?: string } | null;
  loading: boolean;
}

@Component({
  selector: 'app-ai-providers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule,
    SelectModule, ToastModule, BreadcrumbModule, DividerModule,
    TagModule, TooltipModule, SidebarComponent
  ],
  providers: [MessageService],
  templateUrl: './ai-providers.component.html'
})
export class AiProvidersComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'IA' }, { label: 'Configurar' }];

  providers: ProviderCard[] = [
    {
      key: 'gemini',
      label: 'Google Gemini',
      logo: 'assets/icons/gemini.svg',
      color: '#4285F4',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      models: [
        { label: 'Gemini 2.5 Flash (recomendado)', value: 'gemini-2.5-flash' },
        { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
        { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
        { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' }
      ],
      tokenPlaceholder: 'Cole sua API Key do Google AI Studio',
      config: { token: '', model: 'gemini-2.5-flash', status: 'enabled' },
      configured: false, showToken: false, saving: false, testing: false, testResult: null, loading: true
    },
    {
      key: 'openai',
      label: 'OpenAI ChatGPT',
      logo: 'assets/icons/openai.svg',
      color: '#10A37F',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      docsUrl: 'https://platform.openai.com/api-keys',
      models: [
        { label: 'GPT-4o Mini (recomendado)', value: 'gpt-4o-mini' },
        { label: 'GPT-4o', value: 'gpt-4o' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
      ],
      tokenPlaceholder: 'sk-... (OpenAI API Key)',
      config: { token: '', model: 'gpt-4o-mini', status: 'enabled' },
      configured: false, showToken: false, saving: false, testing: false, testResult: null, loading: true
    },
    {
      key: 'claude',
      label: 'Anthropic Claude',
      logo: 'assets/icons/claude.svg',
      color: '#D97706',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      models: [
        { label: 'Claude Haiku 4.5 (rápido)', value: 'claude-haiku-4-5-20251001' },
        { label: 'Claude Sonnet 4.6 (recomendado)', value: 'claude-sonnet-4-6' },
        { label: 'Claude Opus 4.6 (avançado)', value: 'claude-opus-4-6' }
      ],
      tokenPlaceholder: 'sk-ant-... (Anthropic API Key)',
      config: { token: '', model: 'claude-haiku-4-5-20251001', status: 'enabled' },
      configured: false, showToken: false, saving: false, testing: false, testResult: null, loading: true
    }
  ];

  statusOptions = [
    { label: 'Ativo', value: 'enabled' },
    { label: 'Inativo', value: 'disabled' }
  ];

  constructor(
    private aiProvidersService: AiProvidersService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.aiProvidersService.getAll().subscribe({
      next: (data) => {
        for (const card of this.providers) {
          const saved = data[card.key] as ProviderConfig | null;
          card.loading = false;
          if (saved) {
            card.configured = true;
            card.config.token = saved.value?.token || '';
            card.config.model = saved.value?.model || card.config.model;
            card.config.status = (saved.status as any) || 'enabled';
          } else {
            card.configured = false;
          }
        }
      },
      error: () => {
        this.providers.forEach(p => p.loading = false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar configurações' });
      }
    });
  }

  save(card: ProviderCard): void {
    if (!card.config.token && !card.configured) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe a chave de API' });
      return;
    }

    card.saving = true;
    this.aiProvidersService.save(card.key, card.config).subscribe({
      next: () => {
        card.saving = false;
        card.configured = true;
        card.testResult = null;
        this.messageService.add({ severity: 'success', summary: 'Salvo!', detail: `${card.label} configurado com sucesso` });
      },
      error: (err: any) => {
        card.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Erro ao salvar' });
      }
    });
  }

  test(card: ProviderCard): void {
    const tokenToTest = card.config.token && !card.config.token.startsWith('••')
      ? card.config.token : undefined;

    if (!tokenToTest && !card.configured) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Salve a configuração antes de testar' });
      return;
    }

    card.testing = true;
    card.testResult = null;

    this.aiProvidersService.test(card.key, tokenToTest, card.config.model).subscribe({
      next: (result) => {
        card.testing = false;
        card.testResult = result;
        if (result.success) {
          this.messageService.add({ severity: 'success', summary: 'Conexão OK!', detail: `${card.label} respondeu com sucesso` });
        }
      },
      error: (err: any) => {
        card.testing = false;
        card.testResult = { success: false, message: err?.error?.message || 'Erro de conexão' };
        this.messageService.add({ severity: 'error', summary: 'Falha', detail: err?.error?.message || 'Erro ao testar conexão' });
      }
    });
  }

  remove(card: ProviderCard): void {
    if (!confirm(`Remover a configuração de ${card.label}?`)) return;
    this.aiProvidersService.delete(card.key).subscribe({
      next: () => {
        card.configured = false;
        card.config = { token: '', model: card.models[0].value, status: 'enabled' };
        card.testResult = null;
        this.messageService.add({ severity: 'success', summary: 'Removido', detail: `Configuração de ${card.label} removida` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao remover configuração' });
      }
    });
  }
}
