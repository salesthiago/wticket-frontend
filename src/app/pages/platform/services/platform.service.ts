import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import {
  BillingOverview,
  CreateChargeRequest,
  PlatformLead,
  PlatformLeadDashboard,
  PlatformLeadImportResult,
  PlatformLeadImportRow,
  PlatformLeadInput,
  PlatformPayment
} from '../platform.interface';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private apiUrl = `${environment.apiUrl}/platform`;

  constructor(private http: HttpClient) {}

  // Leads
  getLeadDashboard(): Observable<PlatformLeadDashboard> {
    return this.http.get<PlatformLeadDashboard>(`${this.apiUrl}/leads/dashboard`);
  }

  findLeads(params: { search?: string; status?: string; segment?: string } = {}): Observable<PlatformLead[]> {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => !!v));
    return this.http.get<PlatformLead[]>(`${this.apiUrl}/leads`, { params: clean });
  }

  getSegments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/leads/segments`);
  }

  createLead(data: PlatformLeadInput): Observable<PlatformLead> {
    return this.http.post<PlatformLead>(`${this.apiUrl}/leads`, data);
  }

  updateLead(id: string, data: Partial<PlatformLeadInput>): Observable<PlatformLead> {
    return this.http.put<PlatformLead>(`${this.apiUrl}/leads/${id}`, data);
  }

  deleteLead(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/leads/${id}`);
  }

  importLeads(rows: PlatformLeadImportRow[]): Observable<PlatformLeadImportResult> {
    return this.http.post<PlatformLeadImportResult>(`${this.apiUrl}/leads/import`, { rows });
  }

  // Financeiro
  getBillingOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`${this.apiUrl}/billing/overview`);
  }

  findPayments(params: { companyId?: string; status?: string; provider?: string } = {}): Observable<PlatformPayment[]> {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => !!v));
    return this.http.get<PlatformPayment[]>(`${this.apiUrl}/billing/payments`, { params: clean });
  }

  createCharge(data: CreateChargeRequest): Observable<PlatformPayment> {
    return this.http.post<PlatformPayment>(`${this.apiUrl}/billing/charges`, data);
  }

  markPaid(id: string, paidAt?: string): Observable<PlatformPayment> {
    return this.http.post<PlatformPayment>(`${this.apiUrl}/billing/payments/${id}/mark-paid`, { paidAt });
  }

  cancelPayment(id: string): Observable<PlatformPayment> {
    return this.http.post<PlatformPayment>(`${this.apiUrl}/billing/payments/${id}/cancel`, {});
  }

  refundPayment(id: string, reason: string, revokeAccess: boolean): Observable<PlatformPayment> {
    return this.http.post<PlatformPayment>(`${this.apiUrl}/billing/payments/${id}/refund`, { reason, revokeAccess });
  }
}
