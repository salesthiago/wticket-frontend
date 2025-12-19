export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentModel {
  _id?: string;
  contactId: {
    _id: string;
    name: string;
    email?: string;
    phone: string;
  } | string;
  phone: string;
  scheduledDate: string | Date;
  scheduledTime: string;
  scheduledDateTime?: string | Date;
  description: string;
  service?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  status: AppointmentStatus;
  reminderSent?: boolean;
  reminderSentAt?: string | Date;
  confirmedByClient?: boolean;
  confirmedAt?: string | Date;
  notes?: string;
  cancelledAt?: string | Date;
  cancelReason?: string;
  botData?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AppointmentResponse {
  data: AppointmentModel[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu'
};

export const AppointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: 'info',
  confirmed: 'success',
  in_progress: 'warning',
  completed: 'primary',
  cancelled: 'danger',
  no_show: 'secondary'
};
