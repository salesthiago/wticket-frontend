import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';
import {
  Receivable,
  ReceivableCreateInput,
  ReceivableUpdateInput,
  ReceivablePaymentInput,
  ReceivableInvoiceFromOSInput,
  ReceivableDashboard,
  FinancialPaginatedResponse
} from '../../financial.interface';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private apiUrl = `${environment.apiUrl}/financial`;
  private soUrl = `${environment.apiUrl}/service-orders`;

  constructor(private http: HttpClient) {}

  // ─── Contas a Receber ───────────────────────────────────────────────────────

  public listReceivables(params: {
    search?: string;
    status?: string;
    paymentMethod?: string;
    customerId?: string;
    serviceOrderId?: string;
    dueFrom?: string;
    dueTo?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<FinancialPaginatedResponse<Receivable>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<FinancialPaginatedResponse<Receivable>>(
      `${this.apiUrl}/receivables`,
      { params: httpParams }
    );
  }

  public getDashboard(params: { dueFrom?: string; dueTo?: string } = {}): Observable<ReceivableDashboard> {
    let httpParams = new HttpParams();
    if (params.dueFrom) httpParams = httpParams.set('dueFrom', params.dueFrom);
    if (params.dueTo) httpParams = httpParams.set('dueTo', params.dueTo);
    return this.http.get<ReceivableDashboard>(
      `${this.apiUrl}/receivables/dashboard`,
      { params: httpParams }
    );
  }

  public getReceivable(id: string): Observable<Receivable> {
    return this.http.get<Receivable>(`${this.apiUrl}/receivables/${id}`);
  }

  public createReceivable(data: ReceivableCreateInput): Observable<Receivable> {
    return this.http.post<Receivable>(`${this.apiUrl}/receivables`, data);
  }

  public updateReceivable(id: string, data: ReceivableUpdateInput): Observable<Receivable> {
    return this.http.put<Receivable>(`${this.apiUrl}/receivables/${id}`, data);
  }

  public registerPayment(id: string, data: ReceivablePaymentInput): Observable<Receivable> {
    return this.http.patch<Receivable>(`${this.apiUrl}/receivables/${id}/payment`, data);
  }

  public reversePayment(id: string, notes?: string): Observable<Receivable> {
    return this.http.patch<Receivable>(`${this.apiUrl}/receivables/${id}/payment/reverse`, { notes });
  }

  public cancelReceivable(id: string, reason?: string): Observable<Receivable> {
    return this.http.patch<Receivable>(`${this.apiUrl}/receivables/${id}/cancel`, { reason });
  }

  public deleteReceivable(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/receivables/${id}/destroy`);
  }

  // ─── Faturamento de Ordens de Serviço ──────────────────────────────────────

  public invoiceServiceOrder(serviceOrderId: string, data: ReceivableInvoiceFromOSInput): Observable<Receivable> {
    return this.http.post<Receivable>(`${this.soUrl}/${serviceOrderId}/invoice`, data);
  }

  public listReceivablesByServiceOrder(serviceOrderId: string): Observable<Receivable[]> {
    return this.http.get<Receivable[]>(`${this.soUrl}/${serviceOrderId}/receivables`);
  }
}
