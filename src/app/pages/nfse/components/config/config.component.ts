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
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import {
  NfseConfig,
  NfseAmbiente,
  NfseAmbienteLabels,
  NfseOpSimpNac,
  NfseOpSimpNacLabels,
  NfseRegEspTrib,
  NfseRegEspTribLabels,
  NfseMunicipality,
  NfseEndpointResolution,
  NfseCertificateInfo
} from '../../nfse.interface';

@Component({
  selector: 'app-nfse-config',
  standalone: true,
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
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
export class ConfigComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'NFS-e' }, { label: 'Configurações' }];

  loading = false;
  saving = false;
  uploading = false;
  removing = false;

  config: NfseConfig = this.emptyConfig();
  configExists = false;
  municipalities: NfseMunicipality[] = [];
  endpointResolution: NfseEndpointResolution | null = null;

  // Upload de certificado
  certFile: File | null = null;
  certPassword = '';
  showPassword = false;

  // Opções de selects
  optionMunicipalities: { label: string; value: string; uf: string }[] = [];
  optionAmbiente = [
    { label: NfseAmbienteLabels[1], value: 1 },
    { label: NfseAmbienteLabels[2], value: 2 }
  ];
  optionOpSimpNac: { label: string; value: NfseOpSimpNac }[] = [1, 2, 3].map(v => ({
    label: NfseOpSimpNacLabels[v as NfseOpSimpNac],
    value: v as NfseOpSimpNac
  }));
  optionRegApTribSN = [
    { label: '1 - Tributos federais e municipal pelo SN', value: 1 },
    { label: '2 - Federais pelo SN; ISSQN pelo município', value: 2 },
    { label: '3 - Federais e municipal fora do SN', value: 3 }
  ];
  optionRegEspTrib: { label: string; value: NfseRegEspTrib }[] = [0, 1, 2, 3, 4, 5, 6].map(v => ({
    label: `${v} - ${NfseRegEspTribLabels[v as NfseRegEspTrib]}`,
    value: v as NfseRegEspTrib
  }));

  constructor(
    private nfse: NfseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.nfse.listMunicipalities().subscribe({
      next: (list) => {
        this.municipalities = list || [];
        this.optionMunicipalities = this.municipalities.map(m => ({
          label: `${m.name} (${m.uf}) — ${m.cMun}`,
          value: m.cMun,
          uf: m.uf
        }));
      }
    });
    this.loadConfig();
  }

  private loadConfig() {
    this.nfse.getConfig().subscribe({
      next: (cfg) => {
        if (cfg && cfg.cMun) {
          this.config = {
            ...this.emptyConfig(),
            ...cfg
          };
          this.configExists = true;
          this.loadEndpoint();
        } else {
          this.config = this.emptyConfig();
          this.configExists = false;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.config = this.emptyConfig();
        this.configExists = false;
      }
    });
  }

  private loadEndpoint() {
    this.nfse.resolveEndpoint().subscribe({
      next: (r) => { this.endpointResolution = r; },
      error: () => { this.endpointResolution = null; }
    });
  }

  onMunicipalityChange() {
    const m = this.municipalities.find(x => x.cMun === this.config.cMun);
    if (m) this.config.uf = m.uf;
  }

  save() {
    if (!this.config.cMun) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione o município emissor' });
      return;
    }
    this.saving = true;
    const payload: Partial<NfseConfig> = {
      cMun: this.config.cMun,
      uf: this.config.uf,
      inscricaoMunicipal: this.config.inscricaoMunicipal,
      ambiente: Number(this.config.ambiente) as NfseAmbiente,
      opSimpNac: Number(this.config.opSimpNac) as NfseOpSimpNac,
      regApTribSN: this.config.opSimpNac === 3 ? this.config.regApTribSN : undefined,
      regEspTrib: Number(this.config.regEspTrib) as NfseRegEspTrib,
      serie: Number(this.config.serie) || 1,
      proximoNumeroDps: Number(this.config.proximoNumeroDps) || 1,
      endpoints: this.config.endpoints,
      verAplic: this.config.verAplic,
      isActive: this.config.isActive ?? true
    };
    this.nfse.saveConfig(payload).subscribe({
      next: (c) => {
        this.config = { ...this.emptyConfig(), ...c };
        this.configExists = true;
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Configuração salva' });
        this.loadEndpoint();
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

  // ─── Certificado ────────────────────────────────────────────────────────────

  onCertFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.messageService.add({ severity: 'warn', summary: 'Arquivo grande', detail: 'O certificado deve ter no máximo 2MB' });
        return;
      }
      if (!/\.(pfx|p12)$/i.test(file.name)) {
        this.messageService.add({ severity: 'warn', summary: 'Tipo inválido', detail: 'Envie um arquivo .pfx ou .p12' });
        return;
      }
      this.certFile = file;
    }
  }

  uploadCertificate() {
    if (!this.certFile) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione o arquivo do certificado' });
      return;
    }
    if (!this.certPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe a senha do certificado' });
      return;
    }
    if (!this.configExists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Salve a configuração antes',
        detail: 'É necessário salvar o município/ambiente antes de enviar o certificado.'
      });
      return;
    }
    this.uploading = true;
    this.nfse.uploadCertificate(this.certFile, this.certPassword).subscribe({
      next: (c) => {
        this.config = { ...this.emptyConfig(), ...c };
        this.uploading = false;
        this.certFile = null;
        this.certPassword = '';
        this.messageService.add({ severity: 'success', summary: 'Certificado enviado', detail: 'Certificado configurado com sucesso' });
      },
      error: (err) => {
        this.uploading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro no certificado',
          detail: err?.error?.message || 'Falha ao processar o certificado. Verifique senha e arquivo.'
        });
      }
    });
  }

  confirmRemoveCertificate(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja realmente remover o certificado configurado?',
      header: 'Remover certificado',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.removeCertificate()
    });
  }

  private removeCertificate() {
    this.removing = true;
    this.nfse.deleteCertificate().subscribe({
      next: () => {
        if (this.config.certificate) this.config.certificate = { configured: false };
        this.removing = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Certificado removido' });
      },
      error: (err) => {
        this.removing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao remover certificado'
        });
      }
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  certInfo(): NfseCertificateInfo | null {
    return this.config.certificate || null;
  }

  certIsConfigured(): boolean {
    return !!this.config.certificate?.configured;
  }

  certBadgeSeverity(): 'success' | 'warn' | 'danger' | 'secondary' {
    const c = this.certInfo();
    if (!c?.configured) return 'secondary';
    if (c.expired) return 'danger';
    if (c.daysToExpire != null && c.daysToExpire <= 30) return 'warn';
    return 'success';
  }

  certBadgeLabel(): string {
    const c = this.certInfo();
    if (!c?.configured) return 'Não configurado';
    if (c.expired) return 'Vencido';
    if (c.daysToExpire != null && c.daysToExpire <= 30) return `Expira em ${c.daysToExpire} dias`;
    return 'Válido';
  }

  formatCnpjCpf(doc?: string): string {
    if (!doc) return '—';
    const d = doc.replace(/\D/g, '');
    if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc;
  }

  private emptyConfig(): NfseConfig {
    return {
      cMun: '',
      uf: '',
      inscricaoMunicipal: '',
      ambiente: 2,
      opSimpNac: 1,
      regEspTrib: 0,
      serie: 1,
      proximoNumeroDps: 1,
      endpoints: { homologacao: '', producao: '' },
      verAplic: 'wticket-nfse-1.0',
      certificate: { configured: false }
    };
  }
}
