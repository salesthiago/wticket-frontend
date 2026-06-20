import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import {
  NfseServiceCode,
  NfseIssueInput,
  NfseStatusLabels,
  IbgeMunicipality
} from '../../nfse.interface';

interface RetencaoRow {
  key: 'pis' | 'cofins' | 'irrf' | 'csll' | 'cp';
  label: string;
  retido: boolean;
  aliq: number;
}

@Component({
  selector: 'app-nfse-issuance-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ToggleSwitch,
    Toast,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    TableModule,
    MessageModule,
    TagModule,
    AutoCompleteModule,
    SidebarComponent
  ]
})
export class IssuanceFormComponent implements OnInit {
  loading = false;
  submitting = false;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'NFS-e' },
    { label: 'Emissões', routerLink: '/nfse/issuances' },
    { label: 'Nova Emissão' }
  ];

  // Catálogos
  serviceCodes: NfseServiceCode[] = [];
  optionServiceCodes: { label: string; value: string; raw: NfseServiceCode }[] = [];
  customers: any[] = [];
  optionCustomers: { label: string; value: string; raw: any }[] = [];

  // Form model
  customerId: string | null = null;
  useTomadorOverride = false;
  serviceCodeId: string | null = null;
  cTribNac = '';
  cTribMun = '';
  cNBS = '';
  xDescServ = '';
  cLocPrestacao = '';
  vServ: number = 0;
  descIncond = 0;
  descCond = 0;
  pAliq = 0;
  dCompet: Date = new Date();
  retencaoIss = false;

  retencoes: RetencaoRow[] = [
    { key: 'pis', label: 'PIS', retido: false, aliq: 0.65 },
    { key: 'cofins', label: 'COFINS', retido: false, aliq: 3.0 },
    { key: 'irrf', label: 'IRRF', retido: false, aliq: 1.5 },
    { key: 'csll', label: 'CSLL', retido: false, aliq: 1.0 },
    { key: 'cp', label: 'CP (INSS)', retido: false, aliq: 11.0 }
  ];

  // Tomador override (quando o customer não tem cMun ou queremos sobrescrever)
  tomadorOverride = {
    documentType: 'cpf' as 'cpf' | 'cnpj',
    document: '',
    nome: '',
    email: '',
    fone: '',
    inscricaoMunicipal: '',
    endereco: {
      cMun: '',
      uf: '',
      cep: '',
      xLgr: '',
      nro: '',
      xCpl: '',
      xBairro: ''
    }
  };

  // Autocomplete IBGE para cMun do tomador
  cMunSelected: IbgeMunicipality | null = null;
  cMunSuggestions: IbgeMunicipality[] = [];

  optionDocType = [
    { label: 'CNPJ', value: 'cnpj' },
    { label: 'CPF', value: 'cpf' }
  ];

  cepLoading = false;

  constructor(
    private nfse: NfseService,
    private customersService: CustomersService,
    private router: Router,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.nfse.listServiceCodes({ isActive: true, limit: 200 }).subscribe({
      next: (resp) => {
        this.serviceCodes = resp?.records || [];
        this.optionServiceCodes = this.serviceCodes.map(c => ({
          label: `${c.cTribNac} — ${c.descricao} (${c.aliqISSQN}%)`,
          value: c._id!,
          raw: c
        }));
      }
    });
    this.customersService.findAll({ limit: 500 }).subscribe({
      next: (resp) => {
        this.customers = resp?.records || resp || [];
        this.optionCustomers = this.customers.map(c => ({
          label: c.document ? `${c.name} • ${c.document}` : c.name,
          value: c._id,
          raw: c
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onServiceCodeChange() {
    const sc = this.serviceCodes.find(c => c._id === this.serviceCodeId);
    if (!sc) return;
    this.cTribNac = sc.cTribNac;
    this.cTribMun = sc.cTribMun || '';
    this.cNBS = sc.cNBS || '';
    if (!this.xDescServ) this.xDescServ = sc.descricao;
    this.pAliq = Number(sc.aliqISSQN) || 0;
    this.retencaoIss = !!sc.retencoes?.iss;
    if (sc.retencoes) {
      this.retencoes.forEach(row => {
        const r = (sc.retencoes as any)[row.key];
        if (r) {
          row.retido = !!r.retido;
          row.aliq = Number(r.aliq) || row.aliq;
        }
      });
    }
  }

  // Autocomplete IBGE — busca por nome, opcionalmente filtra por UF informada
  onSearchCMun(event: AutoCompleteCompleteEvent) {
    const q = (event.query || '').trim();
    if (q.length < 2) { this.cMunSuggestions = []; return; }
    const uf = this.tomadorOverride.endereco.uf?.trim();
    this.nfse.searchIbgeMunicipalities(q, uf || undefined, 15).subscribe({
      next: (list) => { this.cMunSuggestions = list || []; },
      error: () => { this.cMunSuggestions = []; }
    });
  }

  // Separar [ngModel] de (ngModelChange) evita que PrimeNG re-renderize
  // o objeto bruto no input quando o field="name" não é resolvido a tempo.
  onCMunModelChange(value: IbgeMunicipality | null) {
    if (value && typeof value === 'object' && value.cMun) {
      this.cMunSelected = value;
      this.tomadorOverride.endereco.cMun = value.cMun;
      this.tomadorOverride.endereco.uf = value.uf;
    } else if (!value) {
      this.cMunSelected = null;
      this.tomadorOverride.endereco.cMun = '';
    }
  }

  onCepBlur(): void {
    const cep = (this.tomadorOverride.endereco.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    this.cepLoading = true;
    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        this.cepLoading = false;
        if (data?.erro) {
          this.messageService.add({ severity: 'warn', summary: 'CEP não encontrado' });
          return;
        }
        if (data.logradouro) this.tomadorOverride.endereco.xLgr = data.logradouro;
        if (data.bairro) this.tomadorOverride.endereco.xBairro = data.bairro;
        if (data.uf) this.tomadorOverride.endereco.uf = data.uf;
        if (data.ibge) {
          this.tomadorOverride.endereco.cMun = data.ibge;
          this.cMunSelected = {
            cMun: data.ibge,
            name: data.localidade || '',
            uf: data.uf || ''
          };
        }
      },
      error: () => {
        this.cepLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao consultar CEP' });
      }
    });
  }

  onCustomerChange() {
    const c = this.customers.find(x => x._id === this.customerId);
    if (!c) return;
    // Se o customer não tem cMun no endereço, sugerir override
    if (!c.address?.cMun) {
      this.useTomadorOverride = true;
      this.tomadorOverride = {
        documentType: (c.documentType || 'cpf').toLowerCase() === 'cnpj' ? 'cnpj' : 'cpf',
        document: c.document || '',
        nome: c.name || '',
        email: c.email || '',
        fone: c.phone || '',
        inscricaoMunicipal: '',
        endereco: {
          cMun: '',
          uf: c.address?.state || '',
          cep: c.address?.zipCode || '',
          xLgr: c.address?.street || '',
          nro: c.address?.number || '',
          xCpl: c.address?.complement || '',
          xBairro: c.address?.neighborhood || ''
        }
      };
    }
  }

  // ─── Cálculos preview ────────────────────────────────────────────────────
  get vBC(): number {
    return Math.max(0, (Number(this.vServ) || 0) - (Number(this.descIncond) || 0));
  }
  get vISSQN(): number {
    return +(this.vBC * (Number(this.pAliq) || 0) / 100).toFixed(2);
  }
  get vTotalRet(): number {
    let t = 0;
    for (const r of this.retencoes) {
      if (r.retido) t += +(this.vBC * (Number(r.aliq) || 0) / 100).toFixed(2);
    }
    if (this.retencaoIss) t += this.vISSQN;
    return +t.toFixed(2);
  }
  get vLiq(): number {
    return +((Number(this.vServ) || 0) - (Number(this.descIncond) || 0) - (Number(this.descCond) || 0) - this.vTotalRet).toFixed(2);
  }

  // ─── Submissão ──────────────────────────────────────────────────────────
  submit() {
    if (!this.cTribNac && !this.serviceCodeId) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um código de serviço ou informe cTribNac.' });
      return;
    }
    if (!this.xDescServ) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Descrição do serviço é obrigatória.' });
      return;
    }
    if (!this.vServ || this.vServ <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Valor do serviço deve ser maior que zero.' });
      return;
    }

    const input: NfseIssueInput = {
      customerId: !this.useTomadorOverride && this.customerId ? this.customerId : undefined,
      serviceCodeId: this.serviceCodeId || undefined,
      cTribNac: this.cTribNac || undefined,
      cTribMun: this.cTribMun || undefined,
      cNBS: this.cNBS || undefined,
      xDescServ: this.xDescServ,
      cLocPrestacao: this.cLocPrestacao || undefined,
      vServ: Number(this.vServ),
      descIncond: Number(this.descIncond) || 0,
      descCond: Number(this.descCond) || 0,
      pAliq: Number(this.pAliq) || 0,
      dCompet: this.dCompet,
      retencoes: {
        iss: this.retencaoIss,
        pis: { retido: this.row('pis').retido, aliq: this.row('pis').aliq },
        cofins: { retido: this.row('cofins').retido, aliq: this.row('cofins').aliq },
        irrf: { retido: this.row('irrf').retido, aliq: this.row('irrf').aliq },
        csll: { retido: this.row('csll').retido, aliq: this.row('csll').aliq },
        cp: { retido: this.row('cp').retido, aliq: this.row('cp').aliq }
      }
    };

    if (this.useTomadorOverride) {
      input.tomadorOverride = {
        documentType: this.tomadorOverride.documentType,
        document: this.tomadorOverride.document,
        nome: this.tomadorOverride.nome,
        email: this.tomadorOverride.email || undefined,
        fone: this.tomadorOverride.fone || undefined,
        inscricaoMunicipal: this.tomadorOverride.inscricaoMunicipal || undefined,
        endereco: { ...this.tomadorOverride.endereco }
      };
    }

    this.submitting = true;
    this.nfse.issue(input).subscribe({
      next: (issuance) => {
        this.submitting = false;
        const status = issuance.status;
        const summary = NfseStatusLabels[status] || status;
        const severity = status === 'authorized' ? 'success' : (status === 'rejected' ? 'error' : 'warn');
        this.messageService.add({
          severity,
          summary,
          detail: status === 'authorized' ? `NFS-e ${issuance.numeroNfse || ''} emitida` : (issuance.mensagensRetorno?.[0]?.mensagem || 'Verifique o detalhe da emissão')
        });
        setTimeout(() => this.router.navigate(['/nfse/issuances/view', issuance._id]), 800);
      },
      error: (err) => {
        this.submitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Falha na emissão',
          detail: err?.error?.message || (err?.error?.details?.join('; ')) || 'Erro ao emitir NFS-e'
        });
      }
    });
  }

  cancel() { this.router.navigate(['/nfse/issuances']); }

  private row(k: RetencaoRow['key']) {
    return this.retencoes.find(r => r.key === k)!;
  }
}
