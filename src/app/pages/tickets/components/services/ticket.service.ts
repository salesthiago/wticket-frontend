import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTickets(filters: any = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`, { params: filters });
  }

  findById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tickets`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tickets/${id}`, data);
  }

  updateStatus(id: string, statusId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/tickets/${id}/status`, { statusId });
  }

  addResponse(id: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tickets/${id}/responses`, { content });
  }

  updateSaleItems(id: string, data: { saleItems?: any[]; categoryId?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tickets/${id}/sale-items`, data);
  }

  destroy(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tickets/${id}/destroy`);
  }
}
