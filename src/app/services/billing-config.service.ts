import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';

export type PaymentProviderKey = 'abacatepay' | 'itau' | 'inter' | 'stripe';
export type BillingPaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card';
export type MtlsProviderKey = 'itau' | 'inter';

export interface MethodRoute {
  method: BillingPaymentMethod;
  enabled: boolean;
  providerKey: PaymentProviderKey;
}

export interface ItauCertificateInfo {
  configured: boolean;
  filename?: string;
  subjectCN?: string;
  issuer?: string;
  notBefore?: string;
  notAfter?: string;
  serialNumber?: string;
  uploadedAt?: string;
  expired?: boolean;
  daysToExpire?: number | null;
}

export interface BillingSettings {
  methods: MethodRoute[];
  abacatepay: { enabled: boolean; configured: boolean };
  itau: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    clientId: string | null;
    beneficiaryId: string | null;
    pixKey: string | null;
    pixKeyType: 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria' | null;
    recurringEnabled: boolean;
    clientSecretConfigured: boolean;
    webhookSecretConfigured: boolean;
    certificate: ItauCertificateInfo;
    privateKey: { configured: boolean; filename?: string; uploadedAt?: string };
  };
  inter: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    clientId: string | null;
    contaCorrente: string | null;
    pixKey: string | null;
    boletoDueDays: number;
    clientSecretConfigured: boolean;
    webhookRegisteredAt: string | null;
    certificate: ItauCertificateInfo;
    privateKey: { configured: boolean; filename?: string; uploadedAt?: string };
  };
  stripe: {
    enabled: boolean;
    environment: 'test' | 'live';
    publishableKey: string | null;
    secretKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
  };
  providers: { key: PaymentProviderKey; supportedMethods: BillingPaymentMethod[]; supportsRecurring: boolean }[];
  updatedAt?: string;
}

export interface UpdateBillingSettings {
  methods?: MethodRoute[];
  abacatepay?: { enabled?: boolean };
  itau?: {
    enabled?: boolean;
    environment?: 'sandbox' | 'production';
    clientId?: string;
    beneficiaryId?: string;
    pixKey?: string;
    pixKeyType?: 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria';
    recurringEnabled?: boolean;
    clientSecret?: string;
    webhookSecret?: string;
  };
  inter?: {
    enabled?: boolean;
    environment?: 'sandbox' | 'production';
    clientId?: string;
    clientSecret?: string;
    contaCorrente?: string;
    pixKey?: string;
    boletoDueDays?: number;
  };
  stripe?: {
    enabled?: boolean;
    environment?: 'test' | 'live';
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class BillingConfigService {
  private apiUrl = `${environment.apiUrl}/billing/settings`;

  constructor(private http: HttpClient) {}

  get(): Observable<BillingSettings> {
    return this.http.get<BillingSettings>(this.apiUrl);
  }

  update(data: UpdateBillingSettings): Observable<BillingSettings> {
    return this.http.put<BillingSettings>(this.apiUrl, data);
  }

  uploadCertificate(file: File, provider: MtlsProviderKey = 'itau'): Observable<BillingSettings> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<BillingSettings>(`${this.apiUrl}/${provider}/certificate`, fd);
  }

  uploadPrivateKey(file: File, provider: MtlsProviderKey = 'itau'): Observable<BillingSettings> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<BillingSettings>(`${this.apiUrl}/${provider}/private-key`, fd);
  }

  /** Cadastra no Inter a URL de webhook (boletos e, se houver chave Pix, Pix). */
  registerInterWebhook(): Observable<{ registered: string[]; settings: BillingSettings }> {
    return this.http.post<{ registered: string[]; settings: BillingSettings }>(`${this.apiUrl}/inter/webhook`, {});
  }
}
