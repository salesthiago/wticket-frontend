import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class BotConfigService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/bot-config', { params })
  }

  public findById(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/bot-config/'+ id)
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/bot-config', data)
  }

  public update(id: string, data: any): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/bot-config/' + id, data)
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/bot-config/' + id, {})
  }
}
