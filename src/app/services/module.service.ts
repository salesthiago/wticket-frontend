import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { ModuleCode } from './auth.service';

export interface ModuleDef {
  _id: string;
  code: ModuleCode;
  name: string;
  description?: string;
  features?: string[];
  price?: number;
  requires?: ModuleCode[];
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {}

  findAll(onlyActive = false): Observable<ModuleDef[]> {
    const params: Record<string, string> = {};
    if (onlyActive) params['onlyActive'] = 'true';
    return this.http.get<ModuleDef[]>(this.apiUrl, { params });
  }

  findById(id: string): Observable<ModuleDef> {
    return this.http.get<ModuleDef>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ModuleDef>): Observable<ModuleDef> {
    return this.http.post<ModuleDef>(this.apiUrl, data);
  }

  update(id: string, data: Partial<ModuleDef>): Observable<ModuleDef> {
    return this.http.put<ModuleDef>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
