import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { ModuleCode } from './auth.service';

export type PlanCycle = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY';

export const CYCLE_LABELS: Record<PlanCycle, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUALLY: 'Semestral',
  ANNUALLY: 'Anual'
};

export interface Plan {
  _id: string;
  name: string;
  description?: string;
  moduleCodes: ModuleCode[];
  /** Preço único do bundle, em BRL (cobrado a cada ciclo). */
  price: number;
  /** Ciclo de cobrança recorrente. */
  cycle?: PlanCycle;
  /** Dias de período trial gratuito para novos cadastros. 0 = sem trial. */
  trialDays?: number;
  /** Produto recorrente vinculado no AbacatePay (somente leitura). */
  abacateProductId?: string;
  isActive?: boolean;
  /** Erro de sincronização com o AbacatePay (retornado em create/update). */
  abacateError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private apiUrl = `${environment.apiUrl}/plans`;

  constructor(private http: HttpClient) {}

  findAll(onlyActive = false): Observable<Plan[]> {
    const params: Record<string, string> = {};
    if (onlyActive) params['onlyActive'] = 'true';
    return this.http.get<Plan[]>(this.apiUrl, { params });
  }

  findById(id: string): Observable<Plan> {
    return this.http.get<Plan>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Plan>): Observable<Plan> {
    return this.http.post<Plan>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Plan>): Observable<Plan> {
    return this.http.put<Plan>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
