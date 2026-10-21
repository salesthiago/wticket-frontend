// Painel da plataforma (super_admin). Os leads aqui são a prospecção da própria
// plataforma — não confundir com os leads das empresas (pages/leads).

export type PlatformLeadStatus = 'new' | 'contacted' | 'negotiating' | 'proposal' | 'won' | 'lost';

export const PlatformLeadStatusOrder: PlatformLeadStatus[] = ['new', 'contacted', 'negotiating', 'proposal', 'won', 'lost'];

export const PlatformLeadStatusLabels: Record<PlatformLeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  negotiating: 'Em negociação',
  proposal: 'Proposta enviada',
  won: 'Fechado',
  lost: 'Perdido'
};

export const PlatformLeadStatusColors: Record<PlatformLeadStatus, string> = {
  new: '#3b82f6',
  contacted: '#06b6d4',
  negotiating: '#f59e0b',
  proposal: '#8b5cf6',
  won: '#22c55e',
  lost: '#ef4444'
};

export const PlatformLeadStatusSeverity: Record<PlatformLeadStatus, 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
  new: 'info',
  contacted: 'info',
  negotiating: 'warn',
  proposal: 'contrast',
  won: 'success',
  lost: 'danger'
};

export interface PlatformLead {
  _id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  status: PlatformLeadStatus;
  segment?: string;
  notes?: string;
  source?: 'manual' | 'csv';
  statusChangedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PlatformLeadInput = Omit<PlatformLead, '_id' | 'source' | 'statusChangedAt' | 'createdAt' | 'updatedAt'>;

export interface PlatformLeadImportRow extends Partial<PlatformLeadInput> {
  /** linha no arquivo (para o relatório de erros) */
  line: number;
}

export interface PlatformLeadImportResult {
  total: number;
  created: number;
  duplicates: number;
  invalid: number;
  errors: { line: number; message: string }[];
}

export interface PlatformLeadDashboard {
  summary: {
    total: number;
    open: number;
    won: number;
    lost: number;
    newThisMonth: number;
    wonThisMonth: number;
    conversionRate: number | null;
  };
  byStatus: { status: PlatformLeadStatus; label: string; count: number }[];
  bySegment: { label: string; count: number }[];
  monthly: { label: string; new: number; won: number }[];
  recent: PlatformLead[];
}

// ─── Financeiro ─────────────────────────────────────────────────────────────

export type BillingSituation = 'up_to_date' | 'overdue' | 'trial' | 'exempt' | 'cancelled';

export const BillingSituationLabels: Record<BillingSituation, string> = {
  up_to_date: 'Em dia',
  overdue: 'Em atraso',
  trial: 'Em teste',
  exempt: 'Isenta',
  cancelled: 'Cancelada'
};

export const BillingSituationSeverity: Record<BillingSituation, 'success' | 'danger' | 'info' | 'secondary' | 'contrast'> = {
  up_to_date: 'success',
  overdue: 'danger',
  trial: 'info',
  exempt: 'secondary',
  cancelled: 'contrast'
};

export interface BillingCompanyRow {
  _id: string;
  name: string;
  document?: string;
  email: string;
  phone?: string;
  status: 'pending_payment' | 'active' | 'suspended' | 'cancelled';
  createdAt?: string;
  plan: { _id: string; name: string; price: number; cycle: string } | null;
  situation: BillingSituation;
  nextChargeAt: string | null;
  trialEndsAt: string | null;
  lastPayment: { paidAt: string; amount: number } | null;
  pendingPayment: { id: string; amount: number; createdAt: string; dueDate?: string; count: number } | null;
}

export interface BillingOverview {
  summary: {
    upToDate: number;
    overdue: number;
    trial: number;
    exempt: number;
    dueIn7Days: number;
    pendingAmount: number;
    receivedThisMonth: number;
    refundedThisMonth: number;
  };
  companies: BillingCompanyRow[];
}

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
export type PaymentProvider = 'abacatepay' | 'itau' | 'stripe' | 'manual';
export type ChargeMethod = 'pix' | 'credit_card' | 'manual';

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  expired: 'Expirado',
  cancelled: 'Cancelado',
  refunded: 'Estornado'
};

export const PaymentStatusSeverity: Record<PaymentStatus, 'warn' | 'success' | 'secondary' | 'danger' | 'contrast'> = {
  pending: 'warn',
  paid: 'success',
  expired: 'secondary',
  cancelled: 'secondary',
  refunded: 'danger'
};

export const PaymentProviderLabels: Record<PaymentProvider, string> = {
  abacatepay: 'AbacatePay (cartão)',
  itau: 'Itaú (Pix)',
  stripe: 'Stripe',
  manual: 'Manual'
};

export interface PlatformPayment {
  _id: string;
  companyId: { _id: string; name: string; document?: string; email?: string } | null;
  planId?: { _id: string; name: string } | null;
  provider: PaymentProvider;
  kind: string;
  amount: number;
  status: PaymentStatus;
  description?: string;
  dueDate?: string;
  checkoutUrl?: string;
  pix?: { qrCode?: string; copyPaste?: string; expiresAt?: string } | null;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  accessRevoked?: boolean;
  periodDays?: number;
  moduleCodes?: string[];
  createdAt: string;
}

export interface CreateChargeRequest {
  companyId: string;
  method: ChargeMethod;
  amount?: number | null;
  dueDate?: string | null;
  description?: string;
}
