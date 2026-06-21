import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import {
  NfseIssuance,
  NfseStatus,
  NfseStatusLabels,
  NfseStatusColors,
  NfseWsLog
} from '../../nfse.interface';

@Component({
  selector: 'app-nfse-issuance-view',
  standalone: true,
  templateUrl: './view.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    Toast,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    TableModule,
    TabsModule,
    MessageModule,
    TimelineModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SidebarComponent
  ]
})
export class IssuanceViewComponent implements OnInit {
  loading = false;
  downloading = false;
  downloadingPdf = false;
  retransmitting = false;
  logsLoading = false;
  saving = false;

  item: NfseIssuance | null = null;
  logs: NfseWsLog[] = [];
  expandedLogId: string | null = null;

  // ─── Edição ─────────────────────────────────────────────────────────────────
  editVisible = false;
  editDraft: any = {};

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'NFS-e' },
    { label: 'Emissões', routerLink: '/nfse/issuances' },
    { label: 'Detalhes' }
  ];

  activeTab = 'snapshot';

  constructor(
    private nfse: NfseService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/nfse/issuances']); return; }
    this.loading = true;
    this.nfse.getIssuance(id).subscribe({
      next: (data) => { this.item = data; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar emissão'
        });
      }
    });
  }

  // ─── Edição ─────────────────────────────────────────────────────────────────

  openEdit(): void {
    if (!this.item) return;
    const t = this.item.tomador;
    const s = this.item.servico;
    const v = this.item.valores;
    this.editDraft = {
      dCompet: this.item.dCompet ? new Date(this.item.dCompet).toISOString().substring(0, 10) : '',
      tomador: {
        documentType: t?.documentType || 'cnpj',
        document: t?.document || '',
        inscricaoMunicipal: t?.inscricaoMunicipal || '',
        nome: t?.nome || '',
        email: t?.email || '',
        fone: t?.fone || '',
        endereco: {
          cMun:    t?.endereco?.cMun    || '',
          uf:      t?.endereco?.uf      || '',
          cep:     t?.endereco?.cep     || '',
          xLgr:    t?.endereco?.xLgr    || '',
          nro:     t?.endereco?.nro     || '',
          xCpl:    t?.endereco?.xCpl    || '',
          xBairro: t?.endereco?.xBairro || ''
        }
      },
      servico: {
        cTribNac:      s?.cTribNac      || '',
        cTribMun:      s?.cTribMun      || '',
        cNBS:          s?.cNBS          || '',
        xDescServ:     s?.xDescServ     || '',
        cLocPrestacao: s?.cLocPrestacao || ''
      },
      valoresInput: {
        vServ:      v?.vServ      ?? 0,
        descIncond: v?.descIncond ?? 0,
        descCond:   v?.descCond   ?? 0,
        pAliq:      v?.issqn?.pAliq ?? 0
      }
    };
    this.editVisible = true;
  }

  saveEdit(): void {
    if (!this.item?._id || this.saving) return;
    this.saving = true;

    // Monta o patch — tomador null se não preencheu documento
    const d = this.editDraft;
    const tomadorDoc = (d.tomador?.document || '').replace(/\D/g, '');
    const patch: any = {
      dCompet: d.dCompet || undefined,
      servico: d.servico,
      valoresInput: d.valoresInput
    };
    if (tomadorDoc) {
      patch.tomador = { ...d.tomador };
    }

    this.nfse.editIssuance(this.item._id, patch).subscribe({
      next: (data) => {
        this.item = data;
        this.saving = false;
        this.editVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Dados corrigidos',
          detail: 'XML regenerado. Use Retransmitir para enviar ao webservice.'
        });
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro ao salvar',
          detail: err?.error?.message || 'Falha ao editar emissão'
        });
      }
    });
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'transmissoes' && this.item?._id && this.logs.length === 0) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.item?._id) return;
    this.logsLoading = true;
    this.nfse.listLogs({ issuanceId: this.item._id, limit: 50 }).subscribe({
      next: (res) => { this.logs = res.records; this.logsLoading = false; },
      error: () => { this.logsLoading = false; }
    });
  }

  toggleLogDetail(logId: string): void {
    this.expandedLogId = this.expandedLogId === logId ? null : logId;
  }

  // ─── Retransmissão ───────────────────────────────────────────────────────────

  retransmit(): void {
    if (!this.item?._id || this.retransmitting) return;
    this.retransmitting = true;
    this.nfse.retransmit(this.item._id).subscribe({
      next: (data) => {
        this.item = data;
        this.logs = [];
        this.retransmitting = false;
        if (data.status === 'authorized') {
          this.messageService.add({ severity: 'success', summary: 'Autorizada', detail: `NFS-e ${data.numeroNfse || ''} autorizada com sucesso` });
        } else {
          const msg = data.mensagensRetorno?.[0];
          this.messageService.add({
            severity: 'warn', summary: 'Retransmissão concluída',
            detail: msg ? `[${msg.codigo}] ${msg.mensagem}` : `Status: ${data.status}`
          });
        }
      },
      error: (err) => {
        this.retransmitting = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro na retransmissão',
          detail: err?.error?.message || 'Falha ao retransmitir'
        });
      }
    });
  }

  canRetransmit(): boolean {
    return this.item?.status === 'error' || this.item?.status === 'rejected';
  }

  // ─── Download ────────────────────────────────────────────────────────────────

  back() { this.router.navigate(['/nfse/issuances']); }

  downloadPdf(openInline = false) {
    if (!this.item?._id) return;
    this.downloadingPdf = true;
    this.nfse.downloadPdf(this.item._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (openInline) {
          window.open(url, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          const a = document.createElement('a');
          const fname = this.item!.numeroNfse
            ? `nfse-${this.item!.numeroNfse}.pdf`
            : `dps-${this.item!.serie}-${this.item!.nDPS}.pdf`;
          a.href = url; a.download = fname; a.click();
          URL.revokeObjectURL(url);
        }
        this.downloadingPdf = false;
      },
      error: (err) => {
        this.downloadingPdf = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao gerar PDF' });
      }
    });
  }

  downloadXml(type: 'dps' | 'nfse') {
    if (!this.item?._id) return;
    this.downloading = true;
    this.nfse.downloadXml(this.item._id, type).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fname = type === 'dps'
          ? `dps-${this.item!.serie}-${this.item!.nDPS}.xml`
          : `nfse-${this.item!.numeroNfse || this.item!._id}.xml`;
        a.href = url; a.download = fname; a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (err) => {
        this.downloading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || `XML ${type.toUpperCase()} indisponível` });
      }
    });
  }

  openConsultaUrl() {
    if (this.item?.urlConsulta) window.open(this.item.urlConsulta, '_blank', 'noopener');
  }

  copyChave() {
    if (!this.item?.chaveAcesso) return;
    navigator.clipboard.writeText(this.item.chaveAcesso).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Chave de acesso copiada' });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  customerName(): string {
    if (!this.item) return '—';
    if (typeof this.item.customerId === 'object' && this.item.customerId) return this.item.customerId.name || '—';
    return this.item.tomador?.nome || '—';
  }

  formatDoc(doc?: string): string {
    if (!doc) return '—';
    const d = doc.replace(/\D/g, '');
    if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc;
  }

  formatChave(c?: string): string {
    if (!c) return '—';
    return c.replace(/(\d{4})/g, '$1 ').trim();
  }

  fullAddress(p: any): string {
    if (!p?.endereco) return '—';
    const e = p.endereco;
    const parts = [
      [e.xLgr, e.nro].filter(Boolean).join(', '),
      e.xCpl, e.xBairro,
      [e.xCidade || '', e.uf].filter(Boolean).join(' / '),
      e.cep
    ].filter(Boolean);
    return parts.join(' • ') || '—';
  }

  wsStatusSeverity(httpStatus?: number): 'success' | 'danger' | 'warn' | 'secondary' {
    if (!httpStatus) return 'secondary';
    if (httpStatus >= 200 && httpStatus < 300) return 'success';
    if (httpStatus >= 500) return 'danger';
    return 'warn';
  }

  statusLabel(s?: NfseStatus): string { return s ? (NfseStatusLabels[s] || s) : ''; }
  statusColor(s?: NfseStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return ((s ? NfseStatusColors[s] : 'secondary') as any) || 'secondary';
  }

  retencoesList() {
    if (!this.item?.valores) return [];
    const v = this.item.valores;
    return [
      { name: 'PIS',      retido: !!v.pis?.retido,    aliq: v.pis?.aliq },
      { name: 'COFINS',   retido: !!v.cofins?.retido,  aliq: v.cofins?.aliq },
      { name: 'IRRF',     retido: !!v.irrf?.retido,    aliq: v.irrf?.aliq },
      { name: 'CSLL',     retido: !!v.csll?.retido,    aliq: v.csll?.aliq },
      { name: 'CP (INSS)',retido: !!v.cp?.retido,      aliq: v.cp?.aliq }
    ].filter(r => r.retido);
  }
}
