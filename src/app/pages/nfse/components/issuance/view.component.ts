import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import {
  NfseIssuance,
  NfseStatus,
  NfseStatusLabels,
  NfseStatusColors
} from '../../nfse.interface';

@Component({
  selector: 'app-nfse-issuance-view',
  standalone: true,
  templateUrl: './view.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
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
    SidebarComponent
  ]
})
export class IssuanceViewComponent implements OnInit {
  loading = false;
  downloading = false;
  downloadingPdf = false;
  item: NfseIssuance | null = null;

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
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar emissão'
        });
      }
    });
  }

  back() { this.router.navigate(['/nfse/issuances']); }

  downloadPdf(openInline = false) {
    if (!this.item?._id) return;
    this.downloadingPdf = true;
    this.nfse.downloadPdf(this.item._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (openInline) {
          window.open(url, '_blank', 'noopener');
          // Revoga após 1 min para garantir que o navegador já carregou
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          const a = document.createElement('a');
          const fname = this.item!.numeroNfse
            ? `nfse-${this.item!.numeroNfse}.pdf`
            : `dps-${this.item!.serie}-${this.item!.nDPS}.pdf`;
          a.href = url;
          a.download = fname;
          a.click();
          URL.revokeObjectURL(url);
        }
        this.downloadingPdf = false;
      },
      error: (err) => {
        this.downloadingPdf = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao gerar PDF'
        });
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
        a.href = url;
        a.download = fname;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (err) => {
        this.downloading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || `XML ${type.toUpperCase()} indisponível`
        });
      }
    });
  }

  openConsultaUrl() {
    if (this.item?.urlConsulta) {
      window.open(this.item.urlConsulta, '_blank', 'noopener');
    }
  }

  copyChave() {
    if (!this.item?.chaveAcesso) return;
    navigator.clipboard.writeText(this.item.chaveAcesso).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Chave de acesso copiada' });
    });
  }

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
      e.xCpl,
      e.xBairro,
      [e.xCidade || '', e.uf].filter(Boolean).join(' / '),
      e.cep
    ].filter(Boolean);
    return parts.join(' • ') || '—';
  }

  statusLabel(s?: NfseStatus): string { return s ? (NfseStatusLabels[s] || s) : ''; }
  statusColor(s?: NfseStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const c = s ? NfseStatusColors[s] : 'secondary';
    return (c as any) || 'secondary';
  }

  retencoesList() {
    if (!this.item?.valores) return [];
    const v = this.item.valores;
    return [
      { name: 'PIS', retido: !!v.pis?.retido, aliq: v.pis?.aliq },
      { name: 'COFINS', retido: !!v.cofins?.retido, aliq: v.cofins?.aliq },
      { name: 'IRRF', retido: !!v.irrf?.retido, aliq: v.irrf?.aliq },
      { name: 'CSLL', retido: !!v.csll?.retido, aliq: v.csll?.aliq },
      { name: 'CP (INSS)', retido: !!v.cp?.retido, aliq: v.cp?.aliq }
    ].filter(r => r.retido);
  }
}
