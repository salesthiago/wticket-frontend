import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class TicketCategoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  findAll(onlyActive = false): Observable<any[]> {
    const params: any = {};
    if (onlyActive) params['active'] = 'true';
    return this.http.get<any[]>(`${this.apiUrl}/ticket-categories`, { params });
  }

  findById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ticket-categories/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ticket-categories`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/ticket-categories/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/ticket-categories/${id}`);
  }
}
