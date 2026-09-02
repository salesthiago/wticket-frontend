import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';

export type PaymentProviderKey = 'abacatepay' | 'itau' | 'stripe';
export type BillingPaymentMethod = 'pix' | 'credit_card' | 'debit_card';

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
    recurringEnabled: boolean;
    clientSecretConfigured: boolean;
    webhookSecretConfigured: boolean;
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
    recurringEnabled?: boolean;
    clientSecret?: string;
    webhookSecret?: string;
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

  uploadCertificate(file: File): Observable<BillingSettings> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<BillingSettings>(`${this.apiUrl}/itau/certificate`, fd);
  }

  uploadPrivateKey(file: File): Observable<BillingSettings> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<BillingSettings>(`${this.apiUrl}/itau/private-key`, fd);
  }
}
