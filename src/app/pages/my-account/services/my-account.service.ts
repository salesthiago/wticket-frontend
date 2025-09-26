import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class MyAccountService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public me(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/profile')
  }

  public changePassword(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/profile/change-password', data)
  }

  public updateProfile(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/profile', data)
  }

}
