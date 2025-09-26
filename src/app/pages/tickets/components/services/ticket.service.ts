import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getTickets(filters: any = {}): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`, { params: filters });
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

}
