// ─── Tipos básicos ────────────────────────────────────────────────────────────

export type ReceivableStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'boleto'
  | 'other';

export const ReceivableStatusLabels: Record<ReceivableStatus, string> = {
  pending: 'Aguardando Pagamento',
  paid: 'Pago',
  overdue: 'Em Atraso',
  cancelled: 'Cancelado'
};

export const ReceivableStatusColors: Record<ReceivableStatus, 'warn' | 'success' | 'danger' | 'secondary'> = {
  pending: 'warn',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'secondary'
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  check: 'Cheque',
  boleto: 'Boleto Bancário',
  other: 'Outro'
};

export const PaymentMethodIcons: Record<PaymentMethod, string> = {
  cash: 'pi pi-wallet',
  pix: 'pi pi-qrcode',
  credit_card: 'pi pi-credit-card',
  debit_card: 'pi pi-credit-card',
  bank_transfer: 'pi pi-arrow-right-arrow-left',
  check: 'pi pi-pencil',
  boleto: 'pi pi-file',
  other: 'pi pi-ellipsis-h'
};

// ─── Modelos ──────────────────────────────────────────────────────────────────

export interface ReceivableStatusHistoryItem {
  status: ReceivableStatus;
  notes?: string;
  changedBy?: { _id: string; name: string } | string;
  changedAt?: string;
}

export interface Receivable {
  _id?: string;
  companyId?: string;
  number?: string;
  description: string;
  amount: number;
  dueDate: string | Date;
  paymentDate?: string | Date | null;
  paymentMethod: PaymentMethod;
  status: ReceivableStatus;

  customerId?: { _id: string; name: string; document?: string; phone?: string; email?: string } | string | null;
  serviceOrderId?: { _id: string; orderNumber?: string; status?: string } | string | null;

  notes?: string;
  cancelReason?: string;

  createdBy?: { _id: string; name: string } | string;
  paidBy?: { _id: string; name: string } | string | null;
  cancelledBy?: { _id: string; name: string } | string | null;

  statusHistory?: ReceivableStatusHistoryItem[];

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface ReceivableCreateInput {
  description: string;
  amount: number;
  dueDate: string | Date;
  paymentMethod: PaymentMethod;
  customerId?: string;
  serviceOrderId?: string;
  notes?: string;
}

export interface ReceivableUpdateInput {
  description?: string;
  amount?: number;
  dueDate?: string | Date;
  paymentMethod?: PaymentMethod;
  customerId?: string | null;
  notes?: string;
}

export interface ReceivablePaymentInput {
  paymentDate?: string | Date;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ReceivableInvoiceFromOSInput {
  description?: string;
  amount?: number;
  dueDate?: string | Date;
  paymentMethod: PaymentMethod;
  customerId?: string;
  notes?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ReceivableDashboardSlice {
  count: number;
  total: number;
}

export interface ReceivableDashboard {
  pending: ReceivableDashboardSlice;
  paid: ReceivableDashboardSlice;
  overdue: ReceivableDashboardSlice;
  cancelled: ReceivableDashboardSlice;
  totalCount: number;
  totalAmount: number;
}

// ─── Resposta paginada ────────────────────────────────────────────────────────

export interface FinancialPaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
}
