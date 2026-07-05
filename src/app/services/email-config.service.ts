import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';

export type EmailServiceStatus = 'enabled' | 'disabled';
export type EmailTemplateCode = 'welcome' | 'forgot_password' | 'pending_debt';

export interface EmailConfigValue {
  region?: string;
  accessKeyId?: string;
  secretKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailConfig {
  status: EmailServiceStatus;
  value: EmailConfigValue;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export type EmailTemplates = Record<EmailTemplateCode, EmailTemplate>;

@Injectable({ providedIn: 'root' })
export class EmailConfigService {
  private apiUrl = `${environment.apiUrl}/email-config`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<EmailConfig> {
    return this.http.get<EmailConfig>(this.apiUrl);
  }

  updateConfig(data: Partial<EmailConfigValue> & { status?: EmailServiceStatus }): Observable<EmailConfig> {
    return this.http.put<EmailConfig>(this.apiUrl, data);
  }

  sendTest(to: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/test`, { to });
  }

  listTemplates(): Observable<EmailTemplates> {
    return this.http.get<EmailTemplates>(`${this.apiUrl}/templates`);
  }

  updateTemplate(code: EmailTemplateCode, data: EmailTemplate): Observable<EmailTemplate> {
    return this.http.put<EmailTemplate>(`${this.apiUrl}/templates/${code}`, data);
  }
}
