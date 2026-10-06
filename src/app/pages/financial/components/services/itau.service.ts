import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';
import {
  ItauConfig,
  ItauConfigStatus,
  ItauBoleto,
  ItauIntegrationLog,
  ItauPaginatedResponse
} from '../../itau.interface';

@Injectable({ providedIn: 'root' })
export class ItauService {
  private apiUrl = `${environment.apiUrl}/financial/itau`;
  private receivablesUrl = `${environment.apiUrl}/financial/receivables`;

  constructor(private http: HttpClient) {}

  // ─── Configuração ──────────────────────────────────────────────────────────

  getConfig(): Observable<ItauConfig | null> {
    return this.http.get<ItauConfig | null>(`${this.apiUrl}/config`);
  }

  getStatus(): Observable<ItauConfigStatus> {
    return this.http.get<ItauConfigStatus>(`${this.apiUrl}/config/status`);
  }

  saveConfig(data: Partial<ItauConfig>): Observable<ItauConfig> {
    return this.http.put<ItauConfig>(`${this.apiUrl}/config`, data);
  }

  testConnection(): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.apiUrl}/config/test-connection`, {});
  }

  uploadCertificate(file: File): Observable<ItauConfig> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ItauConfig>(`${this.apiUrl}/config/certificate`, fd);
  }

  removeCertificate(): Observable<ItauConfig> {
    return this.http.delete<ItauConfig>(`${this.apiUrl}/config/certificate`);
  }

  uploadPrivateKey(file: File): Observable<ItauConfig> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ItauConfig>(`${this.apiUrl}/config/private-key`, fd);
  }

  removePrivateKey(): Observable<ItauConfig> {
    return this.http.delete<ItauConfig>(`${this.apiUrl}/config/private-key`);
  }

  // ─── Histórico de Integração ──────────────────────────────────────────────

  listLogs(params: {
    operation?: string;
    success?: boolean | string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<ItauPaginatedResponse<ItauIntegrationLog>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<ItauPaginatedResponse<ItauIntegrationLog>>(`${this.apiUrl}/logs`, { params: httpParams });
  }

  // ─── Boletos ──────────────────────────────────────────────────────────────

  listBoletos(params: {
    status?: string;
    receivableId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<ItauPaginatedResponse<ItauBoleto>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<ItauPaginatedResponse<ItauBoleto>>(`${this.apiUrl}/boletos`, { params: httpParams });
  }

  getBoleto(id: string): Observable<ItauBoleto> {
    return this.http.get<ItauBoleto>(`${this.apiUrl}/boletos/${id}`);
  }

  refreshBoletoStatus(id: string): Observable<ItauBoleto> {
    return this.http.post<ItauBoleto>(`${this.apiUrl}/boletos/${id}/refresh`, {});
  }

  cancelBoleto(id: string): Observable<ItauBoleto> {
    return this.http.patch<ItauBoleto>(`${this.apiUrl}/boletos/${id}/cancel`, {});
  }

  // ─── Boleto vinculado a um título de Contas a Receber ─────────────────────

  generateBoleto(receivableId: string): Observable<ItauBoleto> {
    return this.http.post<ItauBoleto>(`${this.receivablesUrl}/${receivableId}/itau-boleto`, {});
  }

  getBoletoForReceivable(receivableId: string): Observable<ItauBoleto> {
    return this.http.get<ItauBoleto>(`${this.receivablesUrl}/${receivableId}/itau-boleto`);
  }

  downloadFaturaPdf(receivableId: string): Observable<Blob> {
    return this.http.get(`${this.receivablesUrl}/${receivableId}/itau-boleto/pdf`, { responseType: 'blob' });
  }
}
