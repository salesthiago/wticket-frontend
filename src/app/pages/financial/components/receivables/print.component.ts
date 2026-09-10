import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FinancialService } from '../services/financial.service';
import { CompanyService, Company } from '../../../../services/company.service';
import { AuthService } from '../../../../services/auth.service';
import {
  Receivable,
  ReceivableStatus,
  ReceivableStatusLabels,
  PaymentMethod,
  PaymentMethodLabels
} from '../../financial.interface';

/**
 * Documento de fatura pronto para impressão (layout inspirado nas faturas AWS):
 * cabeçalho com a logomarca e os dados da empresa, quadro de valor/vencimento,
 * emitente, cliente, resumo, memória de cálculo (horas x valor/hora quando o
 * título nasce de um projeto), descrição da fatura e rodapé com o perfil da
 * empresa. Acessível em /financial/receivables/print/:id.
 */
@Component({
  selector: 'app-receivable-print',
  standalone: true,
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  imports: [CommonModule, ButtonModule]
})
export class ReceivablePrintComponent implements OnInit {
  loading = true;
  error = '';
  item: Receivable | null = null;
  company: Company | null = null;

  wticketLogo = '/assets/logo_fundo_branco.png';

  constructor(
    private financial: FinancialService,
    private companyService: CompanyService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/financial/receivables']); return; }

    const companyId = this.auth.getCompanyId();
    forkJoin({
      receivable: this.financial.getReceivable(id),
      company: companyId
        ? this.companyService.findById(companyId).pipe(catchError(() => of(null)))
        : of(null)
    }).subscribe({
      next: ({ receivable, company }) => {
        this.item = receivable;
        this.company = company;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Falha ao carregar a fatura';
      }
    });
  }

  print(): void { window.print(); }
  back(): void {
    if (this.item?._id) this.router.navigate(['/financial/receivables/view', this.item._id]);
    else this.router.navigate(['/financial/receivables']);
  }

  // ─── Empresa (emitente) ────────────────────────────────────────────────────
  companyDocLabel(): string {
    if (!this.company?.document) return '';
    const t = this.company.documentType === 'cpf' ? 'CPF' : 'CNPJ';
    return `${t}: ${this.company.document}`;
  }

  companyAddressLine(): string {
    const a = this.company?.address;
    if (!a) return '';
    const l1 = [a.street, a.number].filter(Boolean).join(', ');
    const l2 = [a.complement, a.neighborhood].filter(Boolean).join(' - ');
    const l3 = [a.city, a.state].filter(Boolean).join(' - ');
    return [l1, l2, l3, a.zipCode].filter(Boolean).join(' • ');
  }

  // ─── Cliente ───────────────────────────────────────────────────────────────
  customerName(): string {
    const c = this.item?.customerId;
    return (c && typeof c === 'object' && c.name) ? c.name : '';
  }
  customerDoc(): string {
    const c: any = this.item?.customerId;
    return (c && typeof c === 'object' && c.document) ? c.document : '';
  }
  customerContact(): string {
    const c: any = this.item?.customerId;
    if (!c || typeof c !== 'object') return '';
    return [c.email, c.phone].filter(Boolean).join(' • ');
  }

  // ─── Vínculo (origem) ──────────────────────────────────────────────────────
  sourceLabel(): string {
    const p: any = this.item?.projectId;
    if (p && typeof p === 'object') {
      return `Projeto ${p.projectNumber || ''}${p.title ? ' — ' + p.title : ''}`.trim();
    }
    const s: any = this.item?.serviceOrderId;
    if (s && typeof s === 'object') {
      return `Ordem de Serviço ${s.orderNumber || ''}`.trim();
    }
    return 'Lançamento manual';
  }

  // ─── Memória de cálculo ────────────────────────────────────────────────────
  get breakdown() { return this.item?.billingBreakdown || null; }
  hasBreakdown(): boolean {
    const b = this.breakdown;
    return !!b && (b.workedHours != null || b.hourlyRate != null);
  }
  breakdownSubtotal(): number {
    const b = this.breakdown;
    if (!b) return 0;
    return Number(b.workedHours || 0) * Number(b.hourlyRate || 0);
  }

  // ─── Formas de pagamento (dados de recebimento da empresa) ────────────────
  get receiving() { return this.company?.receiving || null; }
  hasReceiving(): boolean {
    const r = this.receiving;
    return !!r && !!(r.pixKey || r.bankName || r.bankAccount || r.instructions);
  }
  bankLine(): string {
    const r = this.receiving;
    if (!r) return '';
    const parts: string[] = [];
    if (r.bankName) parts.push(r.bankName);
    if (r.bankBranch) parts.push(`Ag. ${r.bankBranch}`);
    if (r.bankAccount) {
      const t = r.accountType === 'poupanca' ? 'Poupança' : r.accountType === 'corrente' ? 'C/C' : 'Conta';
      parts.push(`${t} ${r.bankAccount}`);
    }
    return parts.join(' • ');
  }
  pixKeyTypeLabel(): string {
    const map: Record<string, string> = {
      cnpj: 'CNPJ', cpf: 'CPF', email: 'E-mail', telefone: 'Telefone', aleatoria: 'Aleatória'
    };
    return this.receiving?.pixKeyType ? (map[this.receiving.pixKeyType] || '') : '';
  }

  // ─── Rótulos ───────────────────────────────────────────────────────────────
  statusLabel(s?: ReceivableStatus): string { return s ? (ReceivableStatusLabels[s] || s) : ''; }
  methodLabel(m?: PaymentMethod): string { return m ? (PaymentMethodLabels[m] || m) : ''; }
}
