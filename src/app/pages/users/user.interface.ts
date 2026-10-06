export type UserRole = 'super_admin' | 'company_admin' | 'administrator' | 'default';

export interface UserModel {
  id?: string;
  name: string;
  email: string;
  password?: string;
  status?: string;
  role?: UserRole;
  companyId?: string | null;
  // Quando setado, restringe este login a ver apenas os Projetos/Tickets deste cliente.
  customerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
