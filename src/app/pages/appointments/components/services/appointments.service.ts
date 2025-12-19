import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppointmentModel, AppointmentResponse } from '../../appointment.interface';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(this.apiUrl + '/appointments', { params });
  }

  public findById(id: string): Observable<AppointmentModel> {
    return this.http.get<AppointmentModel>(this.apiUrl + '/appointments/' + id);
  }

  public create(data: any): Observable<AppointmentModel> {
    return this.http.post<AppointmentModel>(this.apiUrl + '/appointments', data);
  }

  public update(data: any, id: string): Observable<AppointmentModel> {
    return this.http.put<AppointmentModel>(this.apiUrl + '/appointments/' + id, data);
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/appointments/' + id);
  }

  public cancel(id: string, cancelReason?: string): Observable<AppointmentModel> {
    return this.http.patch<AppointmentModel>(this.apiUrl + '/appointments/' + id + '/cancel', { cancelReason });
  }
}
