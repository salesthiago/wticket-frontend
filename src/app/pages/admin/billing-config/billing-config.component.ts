import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import {
  BillingConfigService,
  BillingSettings,
  MethodRoute,
  PaymentProviderKey,
  UpdateBillingSettings
} from '../../../services/billing-config.service';

const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito'
};

@Component({
  selector: 'app-admin-billing-config',
  standalone: true,
  templateUrl: './billing-config.component.html',
  styleUrls: ['./billing-config.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToggleSwitch,
    TagModule,
    Toast,
    DividerModule,
    MessageModule,
    BreadcrumbModule,
    SidebarComponent
  ]
})
export class BillingConfigComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Painel Admin' }, { label: 'Pagamentos' }];

  loading = false;
  savingMethods = false;
  savingItau = false;
  savingStripe = false;
  uploadingCert = false;
  uploadingKey = false;

  settings: BillingSettings | null = null;

  methodLabels = METHOD_LABELS;
  methods: MethodRoute[] = [];
  providerOptions: { label: string; value: PaymentProviderKey }[] = [];

  environmentOptions = [
    { label: 'Produção', value: 'production' },
    { label: 'Sandbox', value: 'sandbox' }
  ];
  stripeEnvOptions = [
    { label: 'Test', value: 'test' },
    { label: 'Live', value: 'live' }
  ];

  // Rascunhos editáveis (segredos ficam vazios; vazio = manter atual)
  pixKeyTypeOptions = [
    { label: 'CNPJ', value: 'cnpj' },
    { label: 'CPF', value: 'cpf' },
    { label: 'E-mail', value: 'email' },
    { label: 'Telefone', value: 'telefone' },
    { label: 'Chave aleatória', value: 'aleatoria' }
  ];

  itau = {
    enabled: false,
    environment: 'production' as 'sandbox' | 'production',
    clientId: '',
    beneficiaryId: '',
    pixKey: '',
    pixKeyType: '' as '' | 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria',
    recurringEnabled: false,
    clientSecret: '',
    webhookSecret: ''
  };
  stripe = {
    enabled: false,
    environment: 'test' as 'test' | 'live',
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  };

  certFile: File | null = null;
  keyFile: File | null = null;

  constructor(
    private billingConfig: BillingConfigService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.billingConfig.get().subscribe({
      next: (s) => {
        this.apply(s);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastError('Falha ao carregar configuração de pagamentos');
      }
    });
  }

  private apply(s: BillingSettings): void {
    this.settings = s;
    this.methods = s.methods.map((m) => ({ ...m }));
    this.providerOptions = s.providers.map((p) => ({
      label: this.providerLabel(p.key),
      value: p.key
    }));
    this.itau = {
      enabled: s.itau.enabled,
      environment: s.itau.environment,
      clientId: s.itau.clientId ?? '',
      beneficiaryId: s.itau.beneficiaryId ?? '',
      pixKey: s.itau.pixKey ?? '',
      pixKeyType: s.itau.pixKeyType ?? '',
      recurringEnabled: s.itau.recurringEnabled,
      clientSecret: '',
      webhookSecret: ''
    };
    this.stripe = {
      enabled: s.stripe.enabled,
      environment: s.stripe.environment,
      publishableKey: s.stripe.publishableKey ?? '',
      secretKey: '',
      webhookSecret: ''
    };
  }

  providerLabel(key: PaymentProviderKey): string {
    return key === 'abacatepay' ? 'AbacatePay' : key === 'itau' ? 'Itaú' : 'Stripe';
  }

  /** Provedores que suportam o método da linha (para o <select>). */
  providersFor(method: string): { label: string; value: PaymentProviderKey }[] {
    const supported = new Set(
      (this.settings?.providers ?? [])
        .filter((p) => p.supportedMethods.includes(method as never))
        .map((p) => p.key)
    );
    return this.providerOptions.filter((o) => supported.has(o.value));
  }

  saveMethods(): void {
    this.savingMethods = true;
    this.billingConfig.update({ methods: this.methods }).subscribe({
      next: (s) => {
        this.apply(s);
        this.savingMethods = false;
        this.toastOk('Métodos de pagamento salvos');
      },
      error: (err) => {
        this.savingMethods = false;
        this.toastError(err?.error?.message || 'Falha ao salvar métodos');
      }
    });
  }

  saveItau(): void {
    const payload: UpdateBillingSettings = {
      itau: {
        enabled: this.itau.enabled,
        environment: this.itau.environment,
        clientId: this.itau.clientId.trim(),
        beneficiaryId: this.itau.beneficiaryId.trim(),
        pixKey: this.itau.pixKey.trim(),
        ...(this.itau.pixKeyType ? { pixKeyType: this.itau.pixKeyType } : {}),
        recurringEnabled: this.itau.recurringEnabled,
        ...(this.itau.clientSecret ? { clientSecret: this.itau.clientSecret } : {}),
        ...(this.itau.webhookSecret ? { webhookSecret: this.itau.webhookSecret } : {})
      }
    };
    this.savingItau = true;
    this.billingConfig.update(payload).subscribe({
      next: (s) => {
        this.apply(s);
        this.savingItau = false;
        this.toastOk('Configuração do Itaú salva');
      },
      error: (err) => {
        this.savingItau = false;
        this.toastError(err?.error?.message || 'Falha ao salvar configuração do Itaú');
      }
    });
  }

  saveStripe(): void {
    const payload: UpdateBillingSettings = {
      stripe: {
        enabled: this.stripe.enabled,
        environment: this.stripe.environment,
        publishableKey: this.stripe.publishableKey.trim(),
        ...(this.stripe.secretKey ? { secretKey: this.stripe.secretKey } : {}),
        ...(this.stripe.webhookSecret ? { webhookSecret: this.stripe.webhookSecret } : {})
      }
    };
    this.savingStripe = true;
    this.billingConfig.update(payload).subscribe({
      next: (s) => {
        this.apply(s);
        this.savingStripe = false;
        this.toastOk('Configuração do Stripe salva');
      },
      error: (err) => {
        this.savingStripe = false;
        this.toastError(err?.error?.message || 'Falha ao salvar configuração do Stripe');
      }
    });
  }

  onCertSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.certFile = input.files?.[0] ?? null;
  }

  onKeySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.keyFile = input.files?.[0] ?? null;
  }

  uploadCert(): void {
    if (!this.certFile) {
      this.toastError('Selecione o arquivo .crt');
      return;
    }
    this.uploadingCert = true;
    this.billingConfig.uploadCertificate(this.certFile).subscribe({
      next: (s) => {
        this.apply(s);
        this.certFile = null;
        this.uploadingCert = false;
        this.toastOk('Certificado enviado');
      },
      error: (err) => {
        this.uploadingCert = false;
        this.toastError(err?.error?.message || 'Falha ao enviar o certificado');
      }
    });
  }

  uploadKey(): void {
    if (!this.keyFile) {
      this.toastError('Selecione o arquivo .key');
      return;
    }
    this.uploadingKey = true;
    this.billingConfig.uploadPrivateKey(this.keyFile).subscribe({
      next: (s) => {
        this.apply(s);
        this.keyFile = null;
        this.uploadingKey = false;
        this.toastOk('Chave privada enviada');
      },
      error: (err) => {
        this.uploadingKey = false;
        this.toastError(err?.error?.message || 'Falha ao enviar a chave privada');
      }
    });
  }

  private toastOk(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'OK', detail });
  }

  private toastError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
}
