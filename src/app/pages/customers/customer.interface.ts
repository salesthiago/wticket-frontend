export interface AddressModel {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface CustomerModel {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  documentType?: 'cpf' | 'cnpj';
  document?: string;
  address?: AddressModel;
  source?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
