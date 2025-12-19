import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/whatsapp/sessions', { params })
  }

  public findById(id: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/whatsapp/sessions/'+ id)
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/whatsapp/sessions', data)
  }
  public getQRCode(session: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/whatsapp/sessions/'+ session + '/qrcode')
  }
  public getStatus(session: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/whatsapp/sessions/'+ session + '/status')
  }

  public delete(nameSession: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/whatsapp/sessions/' + nameSession, {})
  }

  getTickets(filters: any = {}): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/tickets`, { params: filters });
  }

  syncContacts(sessionName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/whatsapp/sync/contacts`, { sessionName });
  }

  getSyncStatus(sessionName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/whatsapp/sync/status/${sessionName}`);
  }
}
