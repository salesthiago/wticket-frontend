export interface PermissionModel {
  _id?: string | null;
  name: string;
  sessions: [],
  status: 'enabled' | 'disabled'
  createdAt?: string;
  updatedAt?: string;
}
