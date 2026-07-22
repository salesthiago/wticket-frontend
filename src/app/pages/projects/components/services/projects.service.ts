import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  findAll(filters: any = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects`, { params: filters });
  }

  findById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/projects/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/projects`, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/projects/${id}`, data);
  }

  getTasks(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/${id}/tickets`);
  }

  exportExcel(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/projects/${id}/export/excel`, { responseType: 'blob' });
  }

  destroy(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/projects/${id}/destroy`);
  }
}
