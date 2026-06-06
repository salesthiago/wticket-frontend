import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ServiceOrdersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/service-orders', { params });
  }

  public findById(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/service-orders/' + id);
  }

  public findByCustomer(customerId: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/service-orders/customer/' + customerId);
  }

  public dashboard(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/service-orders/dashboard');
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/service-orders', data);
  }

  public update(data: any, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/service-orders/' + id, data);
  }

  public updateStatus(id: string, data: { status: string; notes?: string }): Observable<any> {
    return this.http.patch<any>(this.apiUrl + '/service-orders/' + id + '/status', data);
  }

  public addDiagnosis(id: string, data: any): Observable<any> {
    return this.http.patch<any>(this.apiUrl + '/service-orders/' + id + '/diagnosis', data);
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/service-orders/' + id + '/destroy');
  }

  public downloadPdf(id: string): Observable<Blob> {
    return this.http.get(this.apiUrl + '/service-orders/' + id + '/pdf', { responseType: 'blob' });
  }

  // Retorna as fotos da OS já com uma viewUrl temporária para exibição direta.
  public getPhotos(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/service-orders/' + id + '/photos');
  }

  // Renova sob demanda a URL temporária de uma foto (ex.: quando a viewUrl expirou).
  public getPhotoUrl(id: string, photoId: string): Observable<{ url: string; expiresIn: number }> {
    return this.http.get<{ url: string; expiresIn: number }>(
      this.apiUrl + '/service-orders/' + id + '/photos/' + photoId + '/url'
    );
  }

  public addPhoto(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<any>(this.apiUrl + '/service-orders/' + id + '/photos', formData);
  }

  public deletePhoto(id: string, photoId: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/service-orders/' + id + '/photos/' + photoId);
  }
}
