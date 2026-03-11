import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/customers', { params });
  }

  public findById(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/customers/' + id);
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/customers', data);
  }

  public update(data: any, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/customers/' + id, data);
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/customers/' + id + '/destroy');
  }
}
