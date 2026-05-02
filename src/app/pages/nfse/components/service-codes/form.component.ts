import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import { NfseServiceCode } from '../../nfse.interface';

interface RetencaoRow {
  key: 'pis' | 'cofins' | 'irrf' | 'csll' | 'cp';
  label: string;
  retido: boolean;
  aliq: number;
}

@Component({
  selector: 'app-nfse-service-code-form',
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
    ToggleSwitch,
    Toast,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    TableModule,
    SidebarComponent
  ]
})
export class ServiceCodeFormComponent implements OnInit {
  id: string | null = null;
  loading = false;
  saving = false;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'NFS-e' },
    { label: 'Códigos de Serviço', routerLink: '/nfse/service-codes' },
    { label: 'Novo Código' }
  ];

  model: NfseServiceCode = this.empty();

  retencaoIss = false;

  retencoes: RetencaoRow[] = [
    { key: 'pis', label: 'PIS', retido: false, aliq: 0.65 },
    { key: 'cofins', label: 'COFINS', retido: false, aliq: 3.0 },
    { key: 'irrf', label: 'IRRF', retido: false, aliq: 1.5 },
    { key: 'csll', label: 'CSLL', retido: false, aliq: 1.0 },
    { key: 'cp', label: 'CP (INSS)', retido: false, aliq: 11.0 }
  ];

  optionLocalIncidencia = [
    { label: 'Município do prestador', value: 'prestador' },
    { label: 'Município do tomador', value: 'tomador' },
    { label: 'Local da prestação do serviço', value: 'local_servico' }
  ];

  constructor(
    private nfse: NfseService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.breadcrumbItems = [
        { label: 'NFS-e' },
        { label: 'Códigos de Serviço', routerLink: '/nfse/service-codes' },
        { label: 'Editar Código' }
      ];
      this.loadById(this.id);
    }
  }

  private loadById(id: string) {
    this.loading = true;
    this.nfse.getServiceCode(id).subscribe({
      next: (data) => {
        this.model = { ...this.empty(), ...data };
        this.retencaoIss = !!data.retencoes?.iss;
        this.retencoes.forEach(row => {
          const r = (data.retencoes as any)?.[row.key];
          if (r) {
            row.retido = !!r.retido;
            row.aliq = Number(r.aliq) || 0;
          }
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar código'
        });
      }
    });
  }

  save() {
    if (!this.model.cTribNac || !/^\d{6}$/.test(this.model.cTribNac)) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'cTribNac deve ter 6 dígitos numéricos' });
      return;
    }
    if (!this.model.descricao) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Descrição é obrigatória' });
      return;
    }
    if (this.model.aliqISSQN == null || this.model.aliqISSQN < 0 || this.model.aliqISSQN > 100) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Alíquota deve estar entre 0 e 100' });
      return;
    }

    const payload: Partial<NfseServiceCode> = {
      cTribNac: this.model.cTribNac,
      cTribMun: this.model.cTribMun || undefined,
      cNBS: this.model.cNBS || undefined,
      descricao: this.model.descricao,
      aliqISSQN: Number(this.model.aliqISSQN),
      localIncidencia: this.model.localIncidencia,
      isActive: this.model.isActive ?? true,
      retencoes: {
        iss: this.retencaoIss,
        pis: this.toRetencao('pis'),
        cofins: this.toRetencao('cofins'),
        irrf: this.toRetencao('irrf'),
        csll: this.toRetencao('csll'),
        cp: this.toRetencao('cp')
      }
    };

    this.saving = true;
    const obs = this.id
      ? this.nfse.updateServiceCode(this.id, payload)
      : this.nfse.createServiceCode(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Código salvo' });
        setTimeout(() => this.router.navigate(['/nfse/service-codes']), 600);
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err?.error?.message || 'Falha ao salvar'
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/nfse/service-codes']);
  }

  private toRetencao(key: RetencaoRow['key']) {
    const row = this.retencoes.find(r => r.key === key)!;
    return { aliq: Number(row.aliq) || 0, retido: row.retido };
  }

  private empty(): NfseServiceCode {
    return {
      cTribNac: '',
      cTribMun: '',
      cNBS: '',
      descricao: '',
      aliqISSQN: 5,
      localIncidencia: 'prestador',
      isActive: true,
      retencoes: {}
    };
  }
}
