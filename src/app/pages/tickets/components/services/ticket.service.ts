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

  getTickets(filters: any = {}): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`, { params: filters });
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any[]>(`${this.apiUrl}/tickets/${id}/${status}`, {});
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any[]>(`${this.apiUrl}/tickets/${id}`, { ...data });
  }

  syncContacts(sessionName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sync/contacts`, { sessionName });
  }

  getSyncStatus(sessionName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sync/status/${sessionName}`);
  }

  destroy(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tickets/${id}/destroy`);
  }

  findById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/${id}`);
  }

  updateSaleItems(id: string, data: { saleItems?: any[]; category?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tickets/${id}/sale-items`, data);
  }
}
