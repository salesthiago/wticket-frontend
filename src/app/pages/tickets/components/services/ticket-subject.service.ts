import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class TicketSubjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  findAll(categoryId?: string, onlyActive = false): Observable<any[]> {
    const params: any = {};
    if (categoryId) params['categoryId'] = categoryId;
    if (onlyActive) params['active'] = 'true';
    return this.http.get<any[]>(`${this.apiUrl}/ticket-subjects`, { params });
  }

  findById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ticket-subjects/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ticket-subjects`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/ticket-subjects/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/ticket-subjects/${id}`);
  }
}
