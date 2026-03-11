import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public findAll(params: any): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/products', { params });
  }

  public findById(id: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/products/' + id);
  }

  public create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/products', data);
  }

  public update(data: any, id: string): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/products/' + id, data);
  }

  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/products/' + id + '/destroy');
  }

  public getImages(productId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${productId}/images`);
  }

  public uploadImage(productId: string, file: File, altText?: string): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    if (altText) formData.append('altText', altText);
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/images`, formData);
  }

  public setMainImage(productId: string, imageId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/products/${productId}/images/${imageId}/main`, {});
  }

  public deleteImage(imageId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/images/${imageId}/destroy`);
  }
}
