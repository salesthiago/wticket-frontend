import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/enviroment';
import {
  AiAgent, AiConversation, ChatResponse, LeadAnalysis, CampaignResult
} from '../ai-agent.interface';

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  private apiUrl = `${environment.apiUrl}/ai-agents`;

  constructor(private http: HttpClient) {}

  // ─── Agentes ───────────────────────────────────────────────────────────────

  list(tipo?: string, status?: string): Observable<AiAgent[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    if (status) params = params.set('status', status);
    return this.http.get<AiAgent[]>(this.apiUrl, { params });
  }

  get(id: string): Observable<AiAgent> {
    return this.http.get<AiAgent>(`${this.apiUrl}/${id}`);
  }

  create(agent: Partial<AiAgent>): Observable<AiAgent> {
    return this.http.post<AiAgent>(this.apiUrl, agent);
  }

  update(id: string, agent: Partial<AiAgent>): Observable<AiAgent> {
    return this.http.put<AiAgent>(`${this.apiUrl}/${id}`, agent);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ─── Chat ──────────────────────────────────────────────────────────────────

  sendMessage(id: string, message: string, conversationId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/${id}/chat`, { message, conversationId });
  }

  // ─── Análise de Lead ────────────────────────────────────────────────────────

  analyzeLead(id: string, leadData: Record<string, any>): Observable<LeadAnalysis> {
    return this.http.post<LeadAnalysis>(`${this.apiUrl}/${id}/analyze-lead`, { leadData });
  }

  // ─── Campanha ───────────────────────────────────────────────────────────────

  generateCampaign(id: string, params: Record<string, any>): Observable<CampaignResult> {
    return this.http.post<CampaignResult>(`${this.apiUrl}/${id}/generate-campaign`, params);
  }

  // ─── Conversas ─────────────────────────────────────────────────────────────

  listConversations(id: string): Observable<AiConversation[]> {
    return this.http.get<AiConversation[]>(`${this.apiUrl}/${id}/conversations`);
  }

  getConversation(agentId: string, convId: string): Observable<AiConversation> {
    return this.http.get<AiConversation>(`${this.apiUrl}/${agentId}/conversations/${convId}`);
  }

  deleteConversation(agentId: string, convId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${agentId}/conversations/${convId}`);
  }
}
