import { PlatformLeadImportRow } from '../platform.interface';

// Cabeçalhos aceitos no CSV (comparados sem acento/caixa) → campo do lead.
const HEADER_ALIASES: Record<string, keyof PlatformLeadImportRow> = {
  nome: 'name', name: 'name', contato: 'name',
  empresa: 'company', company: 'company', 'razao social': 'company',
  telefone: 'phone', phone: 'phone', celular: 'phone', whatsapp: 'phone', fone: 'phone',
  email: 'email', 'e-mail': 'email',
  status: 'status', situacao: 'status',
  ramo: 'segment', segmento: 'segment', segment: 'segment', atividade: 'segment',
  observacoes: 'notes', observacao: 'notes', obs: 'notes', notes: 'notes'
};

const normalize = (v: string) => v.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const LEAD_CSV_TEMPLATE =
  'nome;empresa;telefone;email;status;ramo\n' +
  'Maria Souza;Auto Center Souza;(62) 99999-0000;maria@autocentersouza.com.br;Novo;Oficina mecânica\n';

/** Separa o texto em linhas/células respeitando aspas (inclusive quebras de linha dentro delas). */
function tokenize(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Delimitador mais frequente na 1ª linha (Excel BR exporta com ';'). */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const candidates = [';', ',', '\t'];
  return candidates.reduce((best, d) => firstLine.split(d).length > firstLine.split(best).length ? d : best, ';');
}

export interface ParsedLeadCsv {
  rows: PlatformLeadImportRow[];
  /** cabeçalhos do arquivo que não foram reconhecidos (ignorados) */
  ignoredHeaders: string[];
  /** campos obrigatórios ausentes no cabeçalho */
  missingRequired: string[];
}

export function parseLeadCsv(content: string): ParsedLeadCsv {
  const text = content.replace(/^﻿/, '');
  const table = tokenize(text, detectDelimiter(text));
  const [header = [], ...body] = table;

  const columns = header.map(h => HEADER_ALIASES[normalize(h)] ?? null);
  const ignoredHeaders = header.filter((h, i) => h.trim() && !columns[i]);
  const missingRequired = [
    !columns.includes('name') ? 'nome' : null,
    !columns.includes('phone') ? 'telefone' : null
  ].filter((v): v is string => !!v);

  const rows: PlatformLeadImportRow[] = [];
  body.forEach((cells, i) => {
    if (cells.every(c => !c.trim())) return; // linha em branco
    const row: PlatformLeadImportRow = { line: i + 2 };
    columns.forEach((field, idx) => {
      if (field && field !== 'line') (row as any)[field] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  });

  return { rows, ignoredHeaders, missingRequired };
}

/** Validação local só para a pré-visualização — a validação definitiva é no backend. */
export function rowProblem(row: PlatformLeadImportRow): string | null {
  if (!row.name?.trim()) return 'Nome ausente';
  if ((row.phone || '').replace(/\D/g, '').length < 8) return 'Telefone ausente/inválido';
  return null;
}
