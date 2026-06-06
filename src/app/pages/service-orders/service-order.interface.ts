export type ServiceOrderStatus = 'open' | 'diagnosing' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
export type ServiceOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EquipmentModel {
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  accessories?: string;
  condition?: string;
}

export interface ServiceItemModel {
  description: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // Transiente (apenas UI): serviço selecionado no autocomplete. Removido no envio.
  selectedProduct?: any;
}

export interface PartModel {
  name: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StatusHistoryModel {
  status: string;
  changedBy?: { _id: string; name: string } | string;
  notes?: string;
  changedAt?: string;
}

export interface ServiceOrderModel {
  _id?: string;
  orderNumber?: string;
  customerId: { _id: string; name: string; phone: string; email?: string; document?: string } | string;
  equipment: EquipmentModel;
  reportedIssue: string;
  diagnosis?: string;
  services?: ServiceItemModel[];
  parts?: PartModel[];
  estimatedCost?: number;
  finalCost?: number;
  status?: ServiceOrderStatus;
  priority?: ServiceOrderPriority;
  technicianId?: { _id: string; name: string; email?: string } | string;
  estimatedCompletionDate?: string | Date;
  completedAt?: string;
  deliveredAt?: string;
  warrantyDays?: number;
  warrantyExpiresAt?: string;
  internalNotes?: string;
  cancelReason?: string;
  statusHistory?: StatusHistoryModel[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const ServiceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  open: 'Aberta',
  diagnosing: 'Em Diagnóstico',
  quoted: 'Orçamento Enviado',
  approved: 'Aprovada',
  in_progress: 'Em Execução',
  completed: 'Concluída',
  delivered: 'Entregue',
  cancelled: 'Cancelada'
};

export const ServiceOrderStatusColors: Record<ServiceOrderStatus, string> = {
  open: 'info',
  diagnosing: 'warn',
  quoted: 'warn',
  approved: 'success',
  in_progress: 'info',
  completed: 'success',
  delivered: 'secondary',
  cancelled: 'danger'
};

export const ServiceOrderPriorityLabels: Record<ServiceOrderPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

export const ServiceOrderPriorityColors: Record<ServiceOrderPriority, string> = {
  low: 'secondary',
  normal: 'info',
  high: 'warn',
  urgent: 'danger'
};
