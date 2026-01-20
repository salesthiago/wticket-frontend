import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

export interface GeminiSettings {
  _id?: string;
  name: string;
  value: {
    token: string;
    prompt: string;
    agentName?: string;
  };
  status: 'enabled' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public getSettings(): Observable<GeminiSettings> {
    return this.http.get<GeminiSettings>(this.apiUrl + '/gemini');
  }

  public saveSettings(data: { token: string; prompt: string; agentName: string; status: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/gemini', data);
  }

  public updateSettings(data: { token: string; prompt: string; agentName: string; status: string }): Observable<any> {
    return this.http.put<any>(this.apiUrl + '/gemini', data);
  }

  public deleteSettings(): Observable<any> {
    return this.http.delete<any>(this.apiUrl + '/gemini');
  }

  public sendMessage(message: string): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/gemini/send', { message });
  }
}
