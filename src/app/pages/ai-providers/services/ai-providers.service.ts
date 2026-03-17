import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';

export type AiProviderKey = 'gemini' | 'openai' | 'claude';

export interface ProviderConfig {
  _id?: string;
  name?: string;
  value?: { token?: string; model?: string };
  status?: 'enabled' | 'disabled';
  configured?: boolean;
}

export interface AllProviders {
  gemini: ProviderConfig | null;
  openai: ProviderConfig | null;
  claude: ProviderConfig | null;
}

export interface TestResult {
  success: boolean;
  text?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AiProvidersService {
  private apiUrl = `${environment.apiUrl}/ai-providers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AllProviders> {
    return this.http.get<AllProviders>(this.apiUrl);
  }

  getProvider(provider: AiProviderKey): Observable<ProviderConfig> {
    return this.http.get<ProviderConfig>(`${this.apiUrl}/${provider}`);
  }

  save(provider: AiProviderKey, data: { token?: string; model?: string; status?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${provider}`, data);
  }

  delete(provider: AiProviderKey): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${provider}`);
  }

  test(provider: AiProviderKey, token?: string, model?: string): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/${provider}/test`, { token, model });
  }
}
