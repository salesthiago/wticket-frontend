export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'manual' | 'api';

export interface LeadModel {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  notes?: string;
  status?: LeadStatus;
  source?: LeadSource;
  externalId?: string;
  convertedTo?: { _id: string; name: string; email?: string; phone?: string } | string | null;
  convertedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const LeadStatusLabels: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  converted: 'Convertido em cliente',
  lost: 'Perdido'
};

export const LeadStatusColors: Record<LeadStatus, string> = {
  new: 'info',
  contacted: 'warn',
  qualified: 'warn',
  converted: 'success',
  lost: 'danger'
};
