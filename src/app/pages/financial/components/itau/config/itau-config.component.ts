import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SidebarComponent } from '../../../../../layout/sidebar/sidebar.component';
import { ItauService } from '../../services/itau.service';
import {
  ItauConfig,
  ItauEnvironment,
  ItauEnvironmentLabels,
  ItauPixKeyType,
  ItauPixKeyTypeLabels
} from '../../../itau.interface';

@Component({
  selector: 'app-itau-config',
  standalone: true,
  templateUrl: './itau-config.component.html',
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    PasswordModule,
    ToggleSwitchModule,
    TagModule,
    Toast,
    ConfirmDialog,
    BreadcrumbModule,
    TooltipModule,
    DividerModule,
    MessageModule,
    SidebarComponent
  ]
})
export class ItauConfigComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Financeiro' },
    { label: 'Integração Itaú' },
    { label: 'Configuração' }
  ];

  loading = false;
  saving = false;
  testing = false;
  uploadingCert = false;
  uploadingKey = false;

  config: ItauConfig = this.emptyConfig();

  optionEnvironment = (['homologacao', 'producao'] as ItauEnvironment[]).map(v => ({
    label: ItauEnvironmentLabels[v], value: v
  }));
  optionPixKeyType = (['cnpj', 'cpf', 'email', 'telefone', 'aleatoria'] as ItauPixKeyType[]).map(v => ({
    label: ItauPixKeyTypeLabels[v], value: v
  }));

  constructor(
    private itau: ItauService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private emptyConfig(): ItauConfig {
    return {
      environment: 'homologacao',
      certificate: { configured: false },
      privateKey: { configured: false },
      carteira: '109',
      jurosPercent: 0,
      multaPercent: 0,
      diasBaixaAutomatica: 60,
      isActive: false,
      endereco: {}
    };
  }

  private load(): void {
    this.loading = true;
    this.itau.getConfig().subscribe({
      next: (cfg) => {
        this.config = { ...this.emptyConfig(), ...(cfg || {}) };
        if (!this.config.endereco) this.config.endereco = {};
        this.config.clientSecret = '';
        this.config.webhookSecret = '';
        this.loading = false;
      },
      error: () => {
        this.config = this.emptyConfig();
        this.loading = false;
      }
    });
  }

  save(): void {
    this.saving = true;
    const c = this.config;
    const payload: Partial<ItauConfig> = {
      environment: c.environment,
      clientId: c.clientId,
      agencia: c.agencia,
      conta: c.conta,
      contaDAC: c.contaDAC,
      carteira: c.carteira || '109',
      pixKey: c.pixKey,
      pixKeyType: c.pixKeyType,
      mensagemPix: c.mensagemPix,
      nomeCobranca: c.nomeCobranca,
      documento: c.documento,
      endereco: c.endereco,
      jurosPercent: Number(c.jurosPercent) || 0,
      multaPercent: Number(c.multaPercent) || 0,
      diasBaixaAutomatica: Number(c.diasBaixaAutomatica) || 0,
      instrucoes: c.instrucoes,
      isActive: !!c.isActive
    };
    if (c.clientSecret && c.clientSecret.trim()) payload.clientSecret = c.clientSecret.trim();
    if (c.webhookSecret && c.webhookSecret.trim()) payload.webhookSecret = c.webhookSecret.trim();

    this.itau.saveConfig(payload).subscribe({
      next: (saved) => {
        this.config = { ...this.emptyConfig(), ...saved };
        if (!this.config.endereco) this.config.endereco = {};
        this.config.clientSecret = '';
        this.config.webhookSecret = '';
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Configuração salva' });
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: err?.error?.message || 'Falha ao salvar configuração'
        });
      }
    });
  }

  testConnection(): void {
    this.testing = true;
    this.itau.testConnection().subscribe({
      next: (r) => {
        this.testing = false;
        this.config.testOk = true;
        this.messageService.add({ severity: 'success', summary: 'Conexão OK', detail: r.message });
      },
      error: (err) => {
        this.testing = false;
        this.config.testOk = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Falha na conexão',
          detail: err?.error?.message || 'Não foi possível autenticar no Itaú'
        });
      }
    });
  }

  onCertSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploadingCert = true;
    this.itau.uploadCertificate(file).subscribe({
      next: (cfg) => {
        this.mergeAfterUpload(cfg);
        this.uploadingCert = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Certificado enviado' });
      },
      error: (err) => {
        this.uploadingCert = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha no envio do certificado' });
      }
    });
    input.value = '';
  }

  onKeySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploadingKey = true;
    this.itau.uploadPrivateKey(file).subscribe({
      next: (cfg) => {
        this.mergeAfterUpload(cfg);
        this.uploadingKey = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Chave privada enviada' });
      },
      error: (err) => {
        this.uploadingKey = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha no envio da chave' });
      }
    });
    input.value = '';
  }

  removeCert(): void {
    this.confirmationService.confirm({
      message: 'Remover o certificado mTLS? A integração será desativada até o reenvio.',
      accept: () => {
        this.itau.removeCertificate().subscribe({
          next: (cfg) => { this.mergeAfterUpload(cfg); this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Certificado removido' }); }
        });
      }
    });
  }

  removeKey(): void {
    this.confirmationService.confirm({
      message: 'Remover a chave privada mTLS? A integração será desativada até o reenvio.',
      accept: () => {
        this.itau.removePrivateKey().subscribe({
          next: (cfg) => { this.mergeAfterUpload(cfg); this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Chave removida' }); }
        });
      }
    });
  }

  private mergeAfterUpload(cfg: ItauConfig): void {
    const secret = this.config.clientSecret;
    const webhook = this.config.webhookSecret;
    this.config = { ...this.emptyConfig(), ...cfg };
    if (!this.config.endereco) this.config.endereco = {};
    this.config.clientSecret = secret;
    this.config.webhookSecret = webhook;
  }
}
