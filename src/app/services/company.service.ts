import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { ModuleCode } from './auth.service';

export type CompanyStatus = 'pending_payment' | 'active' | 'suspended' | 'cancelled';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface CompanyAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface CompanyModule {
  moduleId: string | { _id: string; code: ModuleCode; name: string; price?: number };
  code: ModuleCode;
  subscriptionStatus: SubscriptionStatus;
  activatedAt?: string;
  expiresAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  document?: string;
  documentType?: 'cpf' | 'cnpj';
  email: string;
  phone?: string;
  address?: CompanyAddress;
  status: CompanyStatus;
  ownerId?: string;
  modules: CompanyModule[];
  trialEndsAt?: string;
  subscriptionExempt?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterCompanyRequest {
  company: {
    name: string;
    document?: string;
    documentType?: 'cpf' | 'cnpj';
    email: string;
    phone?: string;
    address?: CompanyAddress;
  };
  owner: {
    name: string;
    email: string;
    password: string;
  };
  /** Plano escolhido (preferencial). Define módulos e preço único. */
  planId?: string;
  /** Lista avulsa de módulos (fallback quando não há plano). */
  modules?: ModuleCode[];
}

export interface CheckoutResult {
  paymentId: string;
  url: string;
  amount: number;
  status: string;
  providerBillingId: string;
  moduleCodes: ModuleCode[];
  planId?: string | null;
}

export interface RegisterCompanyResponse {
  company: { id: string; name: string; status: CompanyStatus };
  owner: { id: string; name: string; email: string };
  modules: ModuleCode[];
  plan?: { id: string; name: string; price: number } | null;
  /** Cobrança gerada no cadastro; null se a AbacatePay falhar/não configurada. */
  checkout?: CheckoutResult | null;
  checkoutError?: string | null;
}

// ─── Storage S3 ─────────────────────────────────────────────────────────────

export type StorageSource = 'company' | 'default';

export interface StorageConfigDto {
  source: StorageSource;
  enabled: boolean;
  configured: boolean;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  prefix?: string;
  publicBaseUrl?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  secretAccessKeyMasked?: string | null;
  testedAt?: string | null;
  testOk?: boolean;
  defaultAvailable?: boolean;
}

export interface StorageConfigUpdate {
  enabled?: boolean;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;     // será cifrado no backend (nunca devolvido)
  prefix?: string;
  publicBaseUrl?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface StorageTestResult {
  ok: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/companies`;

  constructor(private http: HttpClient) {}

  register(data: RegisterCompanyRequest): Observable<RegisterCompanyResponse> {
    return this.http.post<RegisterCompanyResponse>(`${this.apiUrl}/register`, data);
  }

  findAll(params: { search?: string; status?: CompanyStatus; page?: number; perPage?: number } = {}): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl, { params: params as any });
  }

  findById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${id}`, data);
  }

  setStatus(id: string, status: CompanyStatus): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}/status`, { status });
  }

  setExempt(id: string, exempt: boolean): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}/exempt`, { exempt });
  }

  addModule(id: string, payload: { code: ModuleCode; subscriptionStatus?: SubscriptionStatus; activatedAt?: string; expiresAt?: string; }): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/${id}/modules`, payload);
  }

  removeModule(id: string, code: ModuleCode): Observable<Company> {
    return this.http.delete<Company>(`${this.apiUrl}/${id}/modules/${code}`);
  }

  setModuleSubscription(id: string, code: ModuleCode, payload: { subscriptionStatus?: SubscriptionStatus; activatedAt?: string; expiresAt?: string; }): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}/modules/${code}`, payload);
  }

  // Storage S3
  getStorageConfig(id: string): Observable<StorageConfigDto> {
    return this.http.get<StorageConfigDto>(`${this.apiUrl}/${id}/storage`);
  }

  updateStorageConfig(id: string, payload: StorageConfigUpdate): Observable<StorageConfigDto> {
    return this.http.put<StorageConfigDto>(`${this.apiUrl}/${id}/storage`, payload);
  }

  deleteStorageConfig(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/storage`);
  }

  testStorageConnection(id: string, payload?: StorageConfigUpdate): Observable<StorageTestResult> {
    return this.http.post<StorageTestResult>(`${this.apiUrl}/${id}/storage/test`, payload || {});
  }
}
