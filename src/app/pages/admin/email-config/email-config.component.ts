import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import {
  EmailConfigService,
  EmailConfigValue,
  EmailServiceStatus,
  EmailTemplateCode,
  EmailTemplate,
  EmailTemplates
} from '../../../services/email-config.service';

interface TemplateCard {
  code: EmailTemplateCode;
  label: string;
  placeholders: string[];
  draft: EmailTemplate;
  saving: boolean;
}

const TEMPLATE_META: { code: EmailTemplateCode; label: string; placeholders: string[] }[] = [
  { code: 'welcome', label: 'Boas-vindas (cadastro)', placeholders: ['{{name}}', '{{companyName}}'] },
  { code: 'forgot_password', label: 'Recuperação de senha', placeholders: ['{{name}}', '{{link}}', '{{expiresInMinutes}}'] },
  { code: 'pending_debt', label: 'Débito pendente', placeholders: ['{{name}}', '{{companyName}}', '{{items}}', '{{totalAmount}}'] }
];

@Component({
  selector: 'app-admin-email-config',
  standalone: true,
  templateUrl: './email-config.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToggleSwitch,
    ToastModule,
    SidebarComponent
  ]
})
export class EmailConfigComponent implements OnInit {
  loading = false;
  saving = false;
  testing = false;

  enabled = false;
  config: EmailConfigValue = { region: '', accessKeyId: '', secretKey: '', fromEmail: '', fromName: '' };
  testEmail = '';

  templates: TemplateCard[] = TEMPLATE_META.map(m => ({
    ...m,
    draft: { subject: '', body: '' },
    saving: false
  }));

  constructor(
    private emailConfigService: EmailConfigService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.emailConfigService.getConfig().subscribe({
      next: (cfg) => {
        this.enabled = cfg.status === 'enabled';
        this.config = { region: '', accessKeyId: '', secretKey: '', fromEmail: '', fromName: '', ...cfg.value };
        this.loading = false;
      },
      error: () => { this.loading = false; this.toastError('Falha ao carregar configuração'); }
    });

    this.emailConfigService.listTemplates().subscribe({
      next: (templates: EmailTemplates) => {
        this.templates.forEach(t => { t.draft = { ...templates[t.code] }; });
      },
      error: () => this.toastError('Falha ao carregar templates')
    });
  }

  saveConfig(): void {
    if (!this.config.region || !this.config.accessKeyId || !this.config.fromEmail) {
      this.toastError('Preencha região, access key e e-mail remetente');
      return;
    }

    const status: EmailServiceStatus = this.enabled ? 'enabled' : 'disabled';
    this.saving = true;
    this.emailConfigService.updateConfig({ ...this.config, status }).subscribe({
      next: (cfg) => {
        this.enabled = cfg.status === 'enabled';
        this.config = { ...this.config, ...cfg.value };
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Configuração salva' });
      },
      error: (err) => { this.saving = false; this.toastError(err?.error?.message || 'Falha ao salvar configuração'); }
    });
  }

  sendTest(): void {
    if (!this.testEmail.trim()) { this.toastError('Informe um e-mail de destino'); return; }
    this.testing = true;
    this.emailConfigService.sendTest(this.testEmail.trim()).subscribe({
      next: (res) => {
        this.testing = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: res.message });
      },
      error: (err) => { this.testing = false; this.toastError(err?.error?.message || 'Falha ao enviar e-mail de teste'); }
    });
  }

  saveTemplate(t: TemplateCard): void {
    if (!t.draft.subject.trim() || !t.draft.body.trim()) {
      this.toastError('Assunto e corpo são obrigatórios');
      return;
    }
    t.saving = true;
    this.emailConfigService.updateTemplate(t.code, t.draft).subscribe({
      next: () => {
        t.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: `Template "${t.label}" salvo` });
      },
      error: (err) => { t.saving = false; this.toastError(err?.error?.message || 'Falha ao salvar template'); }
    });
  }

  private toastError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
}
