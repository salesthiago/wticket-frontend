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
  modules: ModuleCode[];
}

export interface RegisterCompanyResponse {
  company: { id: string; name: string; status: CompanyStatus };
  owner: { id: string; name: string; email: string };
  modules: ModuleCode[];
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

  addModule(id: string, payload: { code: ModuleCode; subscriptionStatus?: SubscriptionStatus; activatedAt?: string; expiresAt?: string; }): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/${id}/modules`, payload);
  }

  removeModule(id: string, code: ModuleCode): Observable<Company> {
    return this.http.delete<Company>(`${this.apiUrl}/${id}/modules/${code}`);
  }

  setModuleSubscription(id: string, code: ModuleCode, payload: { subscriptionStatus?: SubscriptionStatus; activatedAt?: string; expiresAt?: string; }): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/${id}/modules/${code}`, payload);
  }
}
