import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';
import {
  NfseConfig,
  NfseCertificateInfo,
  NfseEndpointResolution,
  NfseMunicipality,
  NfseServiceCode,
  NfseIssuance,
  NfseIssueInput,
  NfseIssueFromServiceOrderInput,
  NfsePaginatedResponse,
  NfseWsLog,
  IbgeMunicipality
} from '../../nfse.interface';

@Injectable({ providedIn: 'root' })
export class NfseService {
  private apiUrl = `${environment.apiUrl}/nfse`;

  constructor(private http: HttpClient) {}

  // ─── Configuração ───────────────────────────────────────────────────────────

  public listMunicipalities(): Observable<NfseMunicipality[]> {
    return this.http.get<NfseMunicipality[]>(`${this.apiUrl}/config/municipalities`);
  }

  public getConfig(): Observable<NfseConfig | null> {
    return this.http.get<NfseConfig | null>(`${this.apiUrl}/config`);
  }

  public saveConfig(data: Partial<NfseConfig>): Observable<NfseConfig> {
    return this.http.put<NfseConfig>(`${this.apiUrl}/config`, data);
  }

  public resolveEndpoint(): Observable<NfseEndpointResolution> {
    return this.http.get<NfseEndpointResolution>(`${this.apiUrl}/config/endpoint`);
  }

  // ─── Certificado Digital ────────────────────────────────────────────────────

  public uploadCertificate(file: File, password: string): Observable<NfseConfig> {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('password', password);
    return this.http.post<NfseConfig>(`${this.apiUrl}/config/certificate`, formData);
  }

  public getCertificateInfo(): Observable<NfseCertificateInfo> {
    return this.http.get<NfseCertificateInfo>(`${this.apiUrl}/config/certificate`);
  }

  public deleteCertificate(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/config/certificate`);
  }

  // ─── Catálogo de Códigos de Serviço ─────────────────────────────────────────

  public listServiceCodes(params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Observable<NfsePaginatedResponse<NfseServiceCode>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', String(params.isActive));
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<NfsePaginatedResponse<NfseServiceCode>>(`${this.apiUrl}/service-codes`, { params: httpParams });
  }

  public getServiceCode(id: string): Observable<NfseServiceCode> {
    return this.http.get<NfseServiceCode>(`${this.apiUrl}/service-codes/${id}`);
  }

  public createServiceCode(data: Partial<NfseServiceCode>): Observable<NfseServiceCode> {
    return this.http.post<NfseServiceCode>(`${this.apiUrl}/service-codes`, data);
  }

  public updateServiceCode(id: string, data: Partial<NfseServiceCode>): Observable<NfseServiceCode> {
    return this.http.put<NfseServiceCode>(`${this.apiUrl}/service-codes/${id}`, data);
  }

  public deleteServiceCode(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/service-codes/${id}/destroy`);
  }

  // ─── Emissão (NFS-e / DPS) ──────────────────────────────────────────────────

  public listIssuances(params: {
    search?: string;
    status?: string;
    customerId?: string;
    serviceOrderId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<NfsePaginatedResponse<NfseIssuance>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<NfsePaginatedResponse<NfseIssuance>>(this.apiUrl, { params: httpParams });
  }

  public getIssuance(id: string): Observable<NfseIssuance> {
    return this.http.get<NfseIssuance>(`${this.apiUrl}/${id}`);
  }

  public issue(data: NfseIssueInput): Observable<NfseIssuance> {
    return this.http.post<NfseIssuance>(this.apiUrl, data);
  }

  public issueFromServiceOrder(serviceOrderId: string, overrides: NfseIssueFromServiceOrderInput): Observable<NfseIssuance> {
    return this.http.post<NfseIssuance>(`${this.apiUrl}/from-service-order/${serviceOrderId}`, overrides);
  }

  public deleteIssuance(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/destroy`);
  }

  public retransmit(id: string): Observable<NfseIssuance> {
    return this.http.post<NfseIssuance>(`${this.apiUrl}/${id}/retransmit`, {});
  }

  /**
   * Retorna o XML como texto (DPS assinada ou retorno NFS-e).
   * type: 'dps' (default) | 'nfse'
   */
  public getXml(id: string, type: 'dps' | 'nfse' = 'dps'): Observable<string> {
    const params = new HttpParams().set('type', type);
    return this.http.get(`${this.apiUrl}/${id}/xml`, { params, responseType: 'text' });
  }

  /**
   * Faz o download do XML como arquivo (Blob).
   */
  public downloadXml(id: string, type: 'dps' | 'nfse' = 'dps'): Observable<Blob> {
    const params = new HttpParams().set('type', type);
    return this.http.get(`${this.apiUrl}/${id}/xml`, { params, responseType: 'blob' });
  }

  /**
   * Faz o download do PDF (DANFSE) como Blob.
   */
  public downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  // ─── Tabela IBGE de municípios (autocomplete + auto-resolve) ────────────────

  public searchIbgeMunicipalities(query: string, uf?: string, limit = 20): Observable<IbgeMunicipality[]> {
    let params = new HttpParams().set('q', query).set('limit', String(limit));
    if (uf) params = params.set('uf', uf);
    return this.http.get<IbgeMunicipality[]>(`${this.apiUrl}/ibge/search`, { params });
  }

  public getIbgeMunicipality(cMun: string): Observable<IbgeMunicipality> {
    return this.http.get<IbgeMunicipality>(`${this.apiUrl}/ibge/${cMun}`);
  }

  public resolveIbgeMunicipality(city: string, uf: string): Observable<IbgeMunicipality> {
    const params = new HttpParams().set('city', city).set('uf', uf);
    return this.http.get<IbgeMunicipality>(`${this.apiUrl}/ibge/resolve`, { params });
  }

  // ─── Auditoria ──────────────────────────────────────────────────────────────

  public listLogs(params: {
    issuanceId?: string;
    operation?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<NfsePaginatedResponse<NfseWsLog>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<NfsePaginatedResponse<NfseWsLog>>(`${this.apiUrl}/logs`, { params: httpParams });
  }
}
