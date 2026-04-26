export type UserRole = 'super_admin' | 'company_admin' | 'administrator' | 'default';

export interface UserModel {
  id?: string;
  name: string;
  email: string;
  password?: string;
  status?: string;
  role?: UserRole;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
