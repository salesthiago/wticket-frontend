export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectStatusModel {
  _id?: string;
  name: string;
  label: string;
  color?: string;
  isDefault?: boolean;
  isClosingStatus?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface ProjectStatsModel {
  totalTasks: number;
  totalWorkedHours: number;
  totalValue: number;
}

export interface ProjectDocumentModel {
  _id?: string;
  url: string;
  viewUrl?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  storageSource?: string;
  uploadedBy?: { _id: string; name: string } | string;
  createdAt?: string;
}

export interface ProjectModel {
  _id?: string;
  projectNumber?: string;
  title: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  closedAt?: string | Date;
  priority?: ProjectPriority;
  statusId?: { _id: string; name: string; label: string; color: string; isClosingStatus?: boolean } | string;
  customerId?: { _id: string; name: string; phone: string; email?: string } | string | null;
  hourlyRate?: number;
  stats?: ProjectStatsModel;
  createdAt?: string;
  updatedAt?: string;
}

export const ProjectPriorityLabels: Record<ProjectPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

export const ProjectPrioritySeverity: Record<ProjectPriority, string> = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'danger'
};
