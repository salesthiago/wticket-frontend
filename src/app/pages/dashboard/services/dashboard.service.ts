import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findDashboardTickets(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/home/dashboard-tickets', { params })
  }

}
