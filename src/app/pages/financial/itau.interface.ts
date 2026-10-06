// ─── Integração Itaú (Financeiro › Contas a Receber) ─────────────────────────

export type ItauEnvironment = 'homologacao' | 'producao';
export type ItauPixKeyType = 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria';

export const ItauEnvironmentLabels: Record<ItauEnvironment, string> = {
  homologacao: 'Homologação',
  producao: 'Produção'
};

export const ItauPixKeyTypeLabels: Record<ItauPixKeyType, string> = {
  cnpj: 'CNPJ',
  cpf: 'CPF',
  email: 'E-mail',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória'
};

export interface ItauCertificateInfo {
  configured: boolean;
  filename?: string;
  subjectCN?: string;
  issuer?: string;
  notBefore?: string;
  notAfter?: string;
  serialNumber?: string;
  uploadedAt?: string;
  expired?: boolean;
  daysToExpire?: number | null;
}

export interface ItauPrivateKeyInfo {
  configured: boolean;
  filename?: string;
  uploadedAt?: string;
}

export interface ItauEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface ItauConfig {
  environment: ItauEnvironment;
  clientId?: string;
  clientSecret?: string;          // write-only (nunca vem do backend)
  webhookSecret?: string;         // write-only
  clientSecretConfigured?: boolean;
  webhookSecretConfigured?: boolean;
  certificate: ItauCertificateInfo;
  privateKey: ItauPrivateKeyInfo;
  agencia?: string;
  conta?: string;
  contaDAC?: string;
  carteira?: string;
  beneficiaryId?: string;
  pixKey?: string;
  pixKeyType?: ItauPixKeyType;
  mensagemPix?: string;
  nomeCobranca?: string;
  documento?: string;
  endereco?: ItauEndereco;
  jurosPercent?: number;
  multaPercent?: number;
  diasBaixaAutomatica?: number;
  instrucoes?: string;
  isActive?: boolean;
  testedAt?: string;
  testOk?: boolean;
  complete?: boolean;
}

export interface ItauConfigStatus {
  configured: boolean;
  active: boolean;
  environment: ItauEnvironment | null;
  testOk: boolean;
  testedAt: string | null;
}

export type ItauBoletoStatus = 'registrado' | 'pago' | 'baixado' | 'vencido' | 'cancelado' | 'erro';

export const ItauBoletoStatusLabels: Record<ItauBoletoStatus, string> = {
  registrado: 'Registrado',
  pago: 'Pago',
  baixado: 'Baixado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
  erro: 'Erro'
};

export const ItauBoletoStatusColors: Record<ItauBoletoStatus, 'warn' | 'success' | 'danger' | 'secondary' | 'info'> = {
  registrado: 'info',
  pago: 'success',
  baixado: 'secondary',
  vencido: 'danger',
  cancelado: 'secondary',
  erro: 'danger'
};

export interface ItauBoletoPix {
  emv?: string;
  qrCodeImage?: string;
  txid?: string;
  location?: string;
  expiraEm?: string;
}

export interface ItauBoleto {
  _id: string;
  receivableId: any;
  customerId?: any;
  nossoNumero?: string;
  carteira?: string;
  agencia?: string;
  conta?: string;
  itauId?: string;
  txid?: string;
  valor: number;
  dataVencimento: string;
  dataEmissao?: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  pix?: ItauBoletoPix | null;
  status: ItauBoletoStatus;
  statusHistory?: { status: string; message?: string; at?: string }[];
  errorMessage?: string;
  createdAt?: string;
}

export type ItauLogOperation =
  | 'oauth_token'
  | 'registrar_boleto'
  | 'consultar_boleto'
  | 'baixar_boleto'
  | 'test_connection'
  | 'webhook';

export const ItauLogOperationLabels: Record<ItauLogOperation, string> = {
  oauth_token: 'Autenticação',
  registrar_boleto: 'Registrar boleto',
  consultar_boleto: 'Consultar boleto',
  baixar_boleto: 'Baixar boleto',
  test_connection: 'Testar conexão',
  webhook: 'Webhook recebido'
};

export interface ItauIntegrationLog {
  _id: string;
  operation: ItauLogOperation;
  method?: string;
  url?: string;
  environment?: string;
  requestBody?: any;
  responseBody?: any;
  httpStatus?: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  boletoId?: any;
  receivableId?: any;
  createdAt: string;
}

export interface ItauPaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
}
