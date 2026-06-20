import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  CompanyService,
  StorageConfigDto,
  StorageConfigUpdate
} from '../../services/company.service';

/**
 * Componente reutilizável de configuração de Storage S3 por empresa.
 * Usado em:
 *   - admin/companies/[id] (super_admin gerencia qualquer empresa)
 *   - my-company (admin da própria empresa edita a sua)
 *
 * Permissão é controlada no backend (super_admin OU company_admin/administrator
 * da própria empresa).
 */
@Component({
  selector: 'app-storage-config',
  standalone: true,
  templateUrl: './storage-config.component.html',
  styleUrls: ['./storage-config.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToggleSwitch,
    TagModule,
    Toast,
    ConfirmDialog,
    TooltipModule,
    DividerModule,
    MessageModule
  ]
})
export class StorageConfigComponent implements OnChanges {
  @Input({ required: true }) companyId!: string;

  loading = false;
  saving = false;
  testing = false;
  removing = false;

  config: StorageConfigDto | null = null;

  // Form model — usamos campos separados para edição (secret nunca volta do backend)
  form = {
    enabled: false,
    bucket: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',          // só preenchido na criação/troca; vazio = mantém atual
    prefix: '',
    publicBaseUrl: '',
    endpoint: '',
    forcePathStyle: false
  };

  // Indica se o usuário digitou um secret novo nesta sessão
  hasNewSecret = false;

  constructor(
    private companyService: CompanyService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId'] && this.companyId) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.companyService.getStorageConfig(this.companyId).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.fillFormFromConfig(cfg);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastErr(err?.error?.message || 'Falha ao carregar configuração de storage');
      }
    });
  }

  private fillFormFromConfig(cfg: StorageConfigDto): void {
    this.form = {
      enabled: !!cfg.enabled,
      bucket: cfg.bucket || '',
      region: cfg.region || '',
      accessKeyId: cfg.accessKeyId || '',
      secretAccessKey: '',                // sempre vazio
      prefix: cfg.prefix || '',
      publicBaseUrl: cfg.publicBaseUrl || '',
      endpoint: cfg.endpoint || '',
      forcePathStyle: !!cfg.forcePathStyle
    };
    this.hasNewSecret = false;
  }

  onSecretChange(): void {
    this.hasNewSecret = !!this.form.secretAccessKey;
  }

  buildPayload(includeSecretIfPresent = true): StorageConfigUpdate {
    const payload: StorageConfigUpdate = {
      enabled: this.form.enabled,
      bucket: this.form.bucket || undefined,
      region: this.form.region || undefined,
      accessKeyId: this.form.accessKeyId || undefined,
      prefix: this.form.prefix || '',
      publicBaseUrl: this.form.publicBaseUrl || '',
      endpoint: this.form.endpoint || '',
      forcePathStyle: !!this.form.forcePathStyle
    };
    if (includeSecretIfPresent && this.form.secretAccessKey) {
      payload.secretAccessKey = this.form.secretAccessKey;
    }
    return payload;
  }

  save(): void {
    if (this.form.enabled) {
      const missing: string[] = [];
      if (!this.form.bucket) missing.push('bucket');
      if (!this.form.region) missing.push('region');
      if (!this.form.accessKeyId) missing.push('accessKeyId');
      const hasSecret = !!this.form.secretAccessKey || !!this.config?.configured;
      if (!hasSecret) missing.push('secretAccessKey');
      if (missing.length) {
        this.toastWarn(`Campos obrigatórios faltando: ${missing.join(', ')}`);
        return;
      }
    }

    this.saving = true;
    this.companyService.updateStorageConfig(this.companyId, this.buildPayload()).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.fillFormFromConfig(cfg);
        this.saving = false;
        this.toastOk('Configuração salva');
      },
      error: (err) => {
        this.saving = false;
        this.toastErr(err?.error?.message || 'Falha ao salvar');
      }
    });
  }

  testConnection(usePending = false): void {
    // usePending=true → testa com dados do form (antes de salvar)
    // usePending=false → testa a config persistida no servidor
    this.testing = true;
    const payload = usePending ? this.buildPayload(true) : undefined;
    this.companyService.testStorageConnection(this.companyId, payload).subscribe({
      next: (r) => {
        this.testing = false;
        if (r.ok) this.toastOk(r.message || 'Conexão OK');
        else this.toastErr(r.message || 'Falha na conexão');
        // Recarrega para refletir testedAt/testOk atualizados (se foi teste persistido)
        if (!usePending) this.load();
      },
      error: (err) => {
        this.testing = false;
        this.toastErr(err?.error?.message || 'Falha ao testar conexão');
      }
    });
  }

  confirmReset(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Remover a configuração desta empresa? Voltará a usar o storage padrão da plataforma.',
      header: 'Voltar para padrão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.resetToDefault()
    });
  }

  private resetToDefault(): void {
    this.removing = true;
    this.companyService.deleteStorageConfig(this.companyId).subscribe({
      next: () => {
        this.removing = false;
        this.toastOk('Configuração removida. Empresa voltou ao storage padrão.');
        this.load();
      },
      error: (err) => {
        this.removing = false;
        this.toastErr(err?.error?.message || 'Falha ao remover');
      }
    });
  }

  // ─── Helpers de UI ─────────────────────────────────────────────────────
  badgeSeverity(): 'success' | 'warn' | 'danger' | 'secondary' {
    if (!this.config) return 'secondary';
    if (this.config.source === 'company' && this.config.enabled) {
      return this.config.testOk ? 'success' : 'warn';
    }
    if (this.config.defaultAvailable) return 'secondary';
    return 'danger';
  }

  badgeLabel(): string {
    if (!this.config) return 'Carregando…';
    if (this.config.source === 'company' && this.config.enabled) {
      return this.config.testOk ? 'Storage próprio (validado)' : 'Storage próprio (não testado)';
    }
    if (this.config.defaultAvailable) return 'Usando padrão da plataforma';
    return 'Sem storage configurado';
  }

  private toastOk(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'OK', detail });
  }
  private toastErr(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
  private toastWarn(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Atenção', detail });
  }
}
