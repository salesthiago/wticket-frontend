export interface AutoResponseOption {
  value: string;
  text: string;
  nextStep?: number | null;
  action?: 'nextStep' | 'callBot' | 'finish';
  targetBotId?: string | null;
}

export interface AutoResponse {
  _id?: string;
  botConfig?: string;
  triggerType: 'keyword' | 'exact_match' | 'regex';
  trigger: string;
  enabled: boolean;
  question: string;
  action: string | null;
  options?: AutoResponseOption[];
  priority: number;
  createdAt?: string;
}
