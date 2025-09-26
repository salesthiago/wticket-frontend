import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/permissions', { params })
  }

  public findById(id: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/users/'+ id)
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/users', data)
  }
  public update(data: any, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/users/' + id, data)
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/users/' + id)
  }
}
