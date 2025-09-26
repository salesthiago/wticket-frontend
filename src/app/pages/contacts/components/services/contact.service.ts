import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactModel } from '../../contact.interface';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/contacts', { params })
  }

  public findById(id: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/contacts/'+ id)
  }

  public create(data: ContactModel): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/contacts', data)
  }
  public update(data: ContactModel, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/contacts/' + id, data)
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/contacts/' + id)
  }
}
