import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class LeadsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/leads', { params });
  }

  public findById(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/leads/' + id);
  }

  public findServiceOrders(id: string): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/leads/' + id + '/service-orders');
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/leads', data);
  }

  public update(data: any, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/leads/' + id, data);
  }

  public convert(id: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/leads/' + id + '/convert', {});
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/leads/' + id + '/destroy');
  }

  // Chaves de API da empresa (integração externa de leads/orçamentos).
  public findApiKeys(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/api-keys');
  }

  public createApiKey(name: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/api-keys', { name });
  }

  public revokeApiKey(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/api-keys/' + id);
  }
}
