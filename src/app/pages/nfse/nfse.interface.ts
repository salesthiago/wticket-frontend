// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

export type NfseAmbiente = 1 | 2; // 1=Produção, 2=Homologação
export type NfseTpEmit = 1 | 2 | 3; // 1=Prestador, 2=Tomador, 3=Intermediário
export type NfseOpSimpNac = 1 | 2 | 3; // 1=Não Optante, 2=MEI, 3=ME/EPP
export type NfseRegEspTrib = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type NfseDocumentType = 'cnpj' | 'cpf' | 'nif';

export type NfseStatus =
  | 'draft'
  | 'signing'
  | 'queued'
  | 'sending'
  | 'processing'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'error';

export const NfseStatusLabels: Record<NfseStatus, string> = {
  draft: 'Rascunho',
  signing: 'Assinando',
  queued: 'Em Fila',
  sending: 'Enviando',
  processing: 'Processando',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  error: 'Erro'
};

export const NfseStatusColors: Record<NfseStatus, string> = {
  draft: 'secondary',
  signing: 'info',
  queued: 'info',
  sending: 'info',
  processing: 'warn',
  authorized: 'success',
  rejected: 'danger',
  cancelled: 'secondary',
  error: 'danger'
};

export const NfseAmbienteLabels: Record<NfseAmbiente, string> = {
  1: 'Produção',
  2: 'Homologação'
};

export const NfseOpSimpNacLabels: Record<NfseOpSimpNac, string> = {
  1: 'Não Optante',
  2: 'MEI',
  3: 'ME/EPP'
};

export const NfseRegEspTribLabels: Record<NfseRegEspTrib, string> = {
  0: 'Nenhum',
  1: 'Ato Cooperado (Cooperativa)',
  2: 'Estimativa',
  3: 'Microempresa Municipal',
  4: 'Notário ou Registrador',
  5: 'Profissional Autônomo',
  6: 'Sociedade de Profissionais'
};

// ─── Município ────────────────────────────────────────────────────────────────

export interface NfseMunicipality {
  cMun: string;
  uf: string;
  name: string;
  provider: string;
  layout: string;
}

// Município retornado pela tabela IBGE (auto-resolve / autocomplete)
export interface IbgeMunicipality {
  cMun: string;
  name: string;
  uf: string;
}

// ─── Configuração ─────────────────────────────────────────────────────────────

export interface NfseCertificateInfo {
  configured: boolean;
  filename?: string;
  subjectCN?: string;
  subjectCNPJ?: string;
  issuer?: string;
  notBefore?: string;
  notAfter?: string;
  serialNumber?: string;
  uploadedAt?: string;
  expired?: boolean;
  daysToExpire?: number | null;
}

export interface NfseEndpoints {
  homologacao?: string;
  producao?: string;
}

export interface NfseConfig {
  _id?: string;
  companyId?: string;
  cMun: string;
  uf: string;
  inscricaoMunicipal?: string;
  ambiente: NfseAmbiente;
  opSimpNac: NfseOpSimpNac;
  regApTribSN?: 1 | 2 | 3;
  regEspTrib: NfseRegEspTrib;
  serie: number;
  proximoNumeroDps: number;
  endpoints?: NfseEndpoints;
  verAplic?: string;
  certificate?: NfseCertificateInfo;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NfseEndpointResolution {
  cMun: string;
  ambiente: NfseAmbiente;
  endpoint: string | null;
  source: 'override' | 'registry';
}

// ─── Catálogo de códigos de serviço ───────────────────────────────────────────

export interface NfseRetencao {
  aliq: number;
  retido: boolean;
}

export interface NfseRetencoes {
  iss?: boolean;
  pis?: NfseRetencao;
  cofins?: NfseRetencao;
  irrf?: NfseRetencao;
  csll?: NfseRetencao;
  cp?: NfseRetencao;
}

export interface NfseServiceCode {
  _id?: string;
  companyId?: string;
  cTribNac: string;
  cTribMun?: string;
  cNBS?: string;
  descricao: string;
  aliqISSQN: number;
  retencoes?: NfseRetencoes;
  localIncidencia?: 'prestador' | 'tomador' | 'local_servico';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Emissão (DPS + NFS-e) ────────────────────────────────────────────────────

export interface NfseAddress {
  cMun?: string;
  uf?: string;
  cep?: string;
  xLgr?: string;
  nro?: string;
  xCpl?: string;
  xBairro?: string;
  cPais?: string;
  cEndPost?: string;
  xCidade?: string;
  xEstProvReg?: string;
}

export interface NfseParty {
  documentType?: NfseDocumentType;
  document?: string;
  inscricaoMunicipal?: string;
  nome?: string;
  email?: string;
  fone?: string;
  endereco?: NfseAddress;
}

export interface NfseServicoSnapshot {
  cTribNac?: string;
  cTribMun?: string;
  cNBS?: string;
  xDescServ?: string;
  cLocPrestacao?: string;
  cPaisPrestacao?: string;
}

export interface NfseValoresSnapshot {
  vServ?: number;
  descIncond?: number;
  descCond?: number;
  issqn?: { tribISSQN?: number; pAliq?: number; tpRetISSQN?: number };
  pis?: NfseRetencao;
  cofins?: NfseRetencao;
  irrf?: NfseRetencao;
  csll?: NfseRetencao;
  cp?: NfseRetencao;
  vBC?: number;
  vISSQN?: number;
  vTotalRet?: number;
  vLiq?: number;
}

export interface NfseMessage {
  codigo?: string;
  mensagem?: string;
  correcao?: string;
}

export interface NfseStatusHistoryItem {
  status: NfseStatus;
  message?: string;
  at?: string;
}

export interface NfseIssuance {
  _id?: string;
  companyId?: string;
  customerId?: { _id: string; name: string; document?: string; email?: string; phone?: string; address?: any } | string;
  serviceOrderId?: { _id: string; orderNumber?: string } | string | null;

  serie: number;
  nDPS: number;
  tpAmb: NfseAmbiente;
  tpEmit: NfseTpEmit;
  cLocEmi: string;
  dCompet: string;
  dhEmi: string;

  chaveAcesso?: string;
  numeroNfse?: string;
  cStat?: string;
  dhProc?: string;
  protocolo?: string;
  urlConsulta?: string;

  prestador: NfseParty;
  tomador?: NfseParty | null;
  intermediario?: NfseParty | null;
  servico: NfseServicoSnapshot;
  valores: NfseValoresSnapshot;

  dpsId?: string;
  status: NfseStatus;
  statusHistory?: NfseStatusHistoryItem[];
  mensagensRetorno?: NfseMessage[];

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Inputs de emissão ────────────────────────────────────────────────────────

export interface NfseIssueInput {
  customerId?: string;
  serviceOrderId?: string;
  serviceCodeId?: string;
  cTribNac?: string;
  cTribMun?: string;
  cNBS?: string;
  xDescServ?: string;
  descricao?: string;
  cLocPrestacao?: string;
  cPaisPrestacao?: string;
  vServ: number;
  descIncond?: number;
  descCond?: number;
  pAliq?: number;
  tribISSQN?: number;
  retencoes?: NfseRetencoes & {
    pis?: { retido?: boolean; aliq?: number };
    cofins?: { retido?: boolean; aliq?: number };
    irrf?: { retido?: boolean; aliq?: number };
    csll?: { retido?: boolean; aliq?: number };
    cp?: { retido?: boolean; aliq?: number };
  };
  dCompet?: string | Date;
  tomadorOverride?: NfseParty;
}

export interface NfseIssueFromServiceOrderInput {
  customerId?: string;
  serviceCodeId?: string;
  cTribNac?: string;
  cTribMun?: string;
  cNBS?: string;
  xDescServ?: string;
  cLocPrestacao?: string;
  vServ?: number;
  descIncond?: number;
  descCond?: number;
  pAliq?: number;
  retencoes?: NfseRetencoes;
  dCompet?: string | Date;
  tomadorOverride?: NfseParty;
}

// ─── Auditoria SOAP ───────────────────────────────────────────────────────────

export interface NfseWsLog {
  _id?: string;
  companyId?: string;
  issuanceId?: string | null;
  operation: string;
  endpoint?: string;
  ambiente?: NfseAmbiente;
  request?: string;
  response?: string;
  httpStatus?: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  createdAt?: string;
}

// ─── Respostas paginadas ──────────────────────────────────────────────────────

export interface NfsePaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  limit: number;
}
