export type AiAgentTipo = 'atendimento' | 'vendas' | 'campanhas' | 'analise_leads';
export type AiAgentTom = 'formal' | 'informal' | 'persuasivo' | 'amigavel' | 'profissional' | 'neutro' | 'empático';
export type AiAgentStatus = 'ativo' | 'inativo';

export interface DadosProduto {
  nome?: string;
  preco?: string;
  beneficios?: string[];
}

export interface AiAgent {
  _id?: string;
  nome: string;
  descricao?: string;
  tipo: AiAgentTipo;
  tom: AiAgentTom;
  regras: string[];
  dados_produto?: DadosProduto | null;
  status: AiAgentStatus;
  totalMensagens?: number;
  totalGeracoes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AiConversation {
  _id?: string;
  agentId: string;
  titulo?: string;
  messages: ChatMessage[];
  contactPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatResponse {
  text: string;
  conversationId: string;
}

export interface LeadAnalysis {
  text: string;
  classificacao: 'QUENTE' | 'MORNO' | 'FRIO' | 'DESCONHECIDO';
}

export interface CampaignResult {
  text: string;
}
