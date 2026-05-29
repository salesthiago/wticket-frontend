import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../services/service-orders.service';
import { ProductsService } from '../../../products/components/services/products.service';
import {
  ServiceOrderStatus,
  ServiceOrderPriority,
  ServiceOrderStatusLabels,
  ServiceOrderStatusColors,
  ServiceOrderPriorityLabels,
  ServiceOrderPriorityColors,
  ServiceItemModel,
  PartModel
} from '../../service-order.interface';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AuthService } from '../../../../services/auth.service';
import { NfseService } from '../../../nfse/components/services/nfse.service';
import {
  NfseIssuance,
  NfseServiceCode,
  NfseStatusLabels,
  NfseStatusColors,
  NfseIssueFromServiceOrderInput,
  NfseStatus
} from '../../../nfse/nfse.interface';
import { FinancialService } from '../../../financial/components/services/financial.service';
import {
  Receivable,
  ReceivableStatus,
  ReceivableStatusLabels,
  ReceivableStatusColors,
  PaymentMethod,
  PaymentMethodLabels,
  ReceivableInvoiceFromOSInput
} from '../../../financial/financial.interface';

@Component({
  selector: 'app-view',
  standalone: true,
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    InputTextModule,
    TableModule,
    ConfirmDialog,
    Toast,
    TimelineModule,
    TooltipModule,
    DatePickerModule,
    DatePipe,
    CurrencyPipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class ViewComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Ordens de Serviço', routerLink: '/service-orders' },
    { label: 'Detalhes' }
  ];

  public order: any = null;
  public loading = false;

  // Dialog de status
  public showStatusDialog = false;
  public newStatus = '';
  public statusNotes = '';
  public statusOptions: any[] = [];

  // Dialog de diagnóstico
  public showDiagnosisDialog = false;
  public diagnosisText = '';
  public estimatedCost: number = 0;
  public diagnosisServices: ServiceItemModel[] = [];
  public diagnosisParts: PartModel[] = [];

  // Catálogo de produtos para vincular às peças (baixa de estoque)
  public products: any[] = [];
  public optionProducts: { label: string; value: string; price: number; stock: number; trackStock: boolean }[] = [];

  // ─── NFS-e ────────────────────────────────────────────────────────────────
  public hasNfseModule = false;
  public nfseIssuances: NfseIssuance[] = [];
  public loadingNfse = false;

  // Dialog de emissão NFS-e
  public showNfseDialog = false;
  public emittingNfse = false;
  public nfseServiceCodes: NfseServiceCode[] = [];
  public optionNfseServiceCodes: { label: string; value: string }[] = [];
  public nfseDraft: {
    serviceCodeId: string | null;
    xDescServ: string;
    vServ: number;
    pAliq: number;
    dCompet: Date;
  } = { serviceCodeId: null, xDescServ: '', vServ: 0, pAliq: 0, dCompet: new Date() };

  // ─── Financeiro ────────────────────────────────────────────────────────────
  public hasFinancialAccess = false;       // módulo + role permitida
  public receivables: Receivable[] = [];
  public loadingReceivables = false;

  // Dialog de faturamento
  public showInvoiceDialog = false;
  public invoicingOrder = false;
  public invoiceDraft: {
    description: string;
    amount: number;
    dueDate: Date;
    paymentMethod: PaymentMethod;
    notes: string;
  } = {
    description: '',
    amount: 0,
    dueDate: new Date(),
    paymentMethod: 'pix',
    notes: ''
  };

  public optionPaymentMethods: { label: string; value: PaymentMethod }[] =
    (Object.keys(PaymentMethodLabels) as PaymentMethod[])
      .map(k => ({ label: PaymentMethodLabels[k], value: k }));

  private id: string = '';

  constructor(
    private service: ServiceOrdersService,
    private productsService: ProductsService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private auth: AuthService,
    private nfse: NfseService,
    private financial: FinancialService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.hasNfseModule = this.auth.hasModule('nfse');
    this.hasFinancialAccess = this.auth.hasModule('financial')
      && this.auth.hasAnyRole('administrator', 'finance');
    if (this.id) {
      this.loadOrder();
      if (this.hasNfseModule) {
        this.loadLinkedIssuances();
      }
      if (this.hasFinancialAccess) {
        this.loadLinkedReceivables();
      }
    }
  }

  // ─── NFS-e ──────────────────────────────────────────────────────────────

  private loadLinkedIssuances() {
    this.loadingNfse = true;
    this.nfse.listIssuances({ serviceOrderId: this.id, limit: 50 }).subscribe({
      next: (resp) => {
        this.nfseIssuances = resp?.records || [];
        this.loadingNfse = false;
      },
      error: () => { this.loadingNfse = false; }
    });
  }

  public openEmitNfseDialog() {
    if (!this.order) return;

    // Preencher draft com dados da OS
    const total = this.order.finalCost > 0
      ? this.order.finalCost
      : ((this.order.services || []).reduce((s: number, i: any) => s + (i.total || 0), 0)
        + (this.order.parts || []).reduce((s: number, i: any) => s + (i.total || 0), 0));

    const desc = (this.order.services || []).map((s: any) => `${s.quantity}x ${s.description}`).join('; ')
      || this.order.diagnosis
      || this.order.reportedIssue
      || '';

    this.nfseDraft = {
      serviceCodeId: null,
      xDescServ: desc,
      vServ: total,
      pAliq: 0,
      dCompet: new Date()
    };

    // Carregar catálogo
    this.nfse.listServiceCodes({ isActive: true, limit: 200 }).subscribe({
      next: (resp) => {
        this.nfseServiceCodes = resp?.records || [];
        this.optionNfseServiceCodes = this.nfseServiceCodes.map(c => ({
          label: `${c.cTribNac} — ${c.descricao} (${c.aliqISSQN}%)`,
          value: c._id!
        }));
      }
    });

    this.showNfseDialog = true;
  }

  public onNfseServiceCodeChange() {
    const sc = this.nfseServiceCodes.find(c => c._id === this.nfseDraft.serviceCodeId);
    if (sc) this.nfseDraft.pAliq = Number(sc.aliqISSQN) || 0;
  }

  public submitEmitNfse() {
    if (!this.nfseDraft.serviceCodeId) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um código de serviço.' });
      return;
    }
    if (!this.nfseDraft.vServ || this.nfseDraft.vServ <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Valor do serviço deve ser maior que zero.' });
      return;
    }
    if (!this.nfseDraft.xDescServ) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Descrição é obrigatória.' });
      return;
    }

    const overrides: NfseIssueFromServiceOrderInput = {
      serviceCodeId: this.nfseDraft.serviceCodeId,
      xDescServ: this.nfseDraft.xDescServ,
      vServ: Number(this.nfseDraft.vServ),
      pAliq: Number(this.nfseDraft.pAliq) || undefined,
      dCompet: this.nfseDraft.dCompet
    };

    this.emittingNfse = true;
    this.nfse.issueFromServiceOrder(this.id, overrides).subscribe({
      next: (issuance) => {
        this.emittingNfse = false;
        this.showNfseDialog = false;
        const status = issuance.status;
        const severity = status === 'authorized' ? 'success' : (status === 'rejected' ? 'error' : 'warn');
        this.messageService.add({
          severity,
          summary: this.nfseStatusLabel(status),
          detail: status === 'authorized'
            ? `NFS-e ${issuance.numeroNfse || ''} emitida com sucesso`
            : (issuance.mensagensRetorno?.[0]?.mensagem || 'Verifique a tela de detalhes.')
        });
        this.loadLinkedIssuances();
        // Se autorizada, levar direto para a tela da NFS-e
        if (status === 'authorized') {
          setTimeout(() => this.router.navigate(['/nfse/issuances/view', issuance._id]), 1500);
        }
      },
      error: (err) => {
        this.emittingNfse = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Falha na emissão',
          detail: err?.error?.message || (err?.error?.details?.join('; ')) || 'Erro ao emitir NFS-e'
        });
      }
    });
  }

  public viewNfse(issuance: NfseIssuance) {
    this.router.navigate(['/nfse/issuances/view', issuance._id]);
  }

  public nfseStatusLabel(s?: NfseStatus): string { return s ? (NfseStatusLabels[s] || s) : ''; }
  public nfseStatusColor(s?: NfseStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const c = s ? NfseStatusColors[s] : 'secondary';
    return (c as any) || 'secondary';
  }
  // ────────────────────────────────────────────────────────────────────────

  // ─── Financeiro ────────────────────────────────────────────────────────────

  private loadLinkedReceivables() {
    this.loadingReceivables = true;
    this.financial.listReceivablesByServiceOrder(this.id).subscribe({
      next: (list) => {
        this.receivables = list || [];
        this.loadingReceivables = false;
      },
      error: () => { this.loadingReceivables = false; }
    });
  }

  public hasActiveReceivable(): boolean {
    return this.receivables.some(r => r.status !== 'cancelled');
  }

  public canInvoiceOS(): boolean {
    if (!this.hasFinancialAccess) return false;
    if (!this.order?.diagnosis || !String(this.order.diagnosis).trim()) return false;
    if (this.hasActiveReceivable()) return false;
    return true;
  }

  public invoiceTooltip(): string {
    if (!this.hasFinancialAccess) {
      return 'Você precisa do módulo Financeiro e role administrator/finance para faturar.';
    }
    if (!this.order?.diagnosis || !String(this.order.diagnosis).trim()) {
      return 'Adicione um diagnóstico antes de faturar esta OS.';
    }
    if (this.hasActiveReceivable()) {
      return 'Esta OS já possui título ativo. Cancele-o antes de faturar novamente.';
    }
    return 'Gerar título a receber a partir desta OS';
  }

  public openInvoiceDialog() {
    if (!this.canInvoiceOS()) return;

    const so = this.order;
    const servicesTotal = (so.services || []).reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const partsTotal = (so.parts || []).reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const total = so.finalCost > 0 ? so.finalCost : (servicesTotal + partsTotal || so.estimatedCost || 0);

    const due = new Date();
    due.setDate(due.getDate() + 30);

    this.invoiceDraft = {
      description: `OS ${so.orderNumber} — ${so.equipment?.type || 'serviço'}`,
      amount: Number(total) || 0,
      dueDate: due,
      paymentMethod: 'pix',
      notes: `Faturamento da OS ${so.orderNumber}`
    };
    this.showInvoiceDialog = true;
  }

  public submitInvoice() {
    if (!this.invoiceDraft.description) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Descrição é obrigatória.' });
      return;
    }
    if (!this.invoiceDraft.amount || this.invoiceDraft.amount <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Valor deve ser maior que zero.' });
      return;
    }
    if (!this.invoiceDraft.dueDate) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Vencimento é obrigatório.' });
      return;
    }

    const payload: ReceivableInvoiceFromOSInput = {
      description: this.invoiceDraft.description,
      amount: Number(this.invoiceDraft.amount),
      dueDate: this.invoiceDraft.dueDate,
      paymentMethod: this.invoiceDraft.paymentMethod,
      notes: this.invoiceDraft.notes || undefined
    };

    this.invoicingOrder = true;
    this.financial.invoiceServiceOrder(this.id, payload).subscribe({
      next: (created) => {
        this.invoicingOrder = false;
        this.showInvoiceDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Título gerado',
          detail: `Título ${created.number} criado com sucesso.`
        });
        this.loadLinkedReceivables();
      },
      error: (err) => {
        this.invoicingOrder = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Falha ao faturar',
          detail: err?.error?.message || 'Erro ao gerar título'
        });
      }
    });
  }

  public viewReceivable(r: Receivable) {
    if (r._id) this.router.navigate(['/financial/receivables/view', r._id]);
  }

  public receivableStatusLabel(s?: ReceivableStatus): string { return s ? (ReceivableStatusLabels[s] || s) : ''; }
  public receivableStatusColor(s?: ReceivableStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const c = s ? ReceivableStatusColors[s] : 'secondary';
    return (c as any) || 'secondary';
  }
  public paymentMethodLabel(m?: string): string {
    return m ? (PaymentMethodLabels[m as PaymentMethod] || m) : '—';
  }
  // ────────────────────────────────────────────────────────────────────────

  private loadOrder() {
    this.loading = true;
    this.service.findById(this.id).subscribe({
      next: (resp: any) => {
        this.order = resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar OS' });
      }
    });
  }

  // Status
  public openStatusDialog() {
    this.statusOptions = [
      { name: 'Aberta', value: 'open' },
      { name: 'Em Diagnóstico', value: 'diagnosing' },
      { name: 'Orçamento Enviado', value: 'quoted' },
      { name: 'Aprovada', value: 'approved' },
      { name: 'Em Execução', value: 'in_progress' },
      { name: 'Concluída', value: 'completed' },
      { name: 'Entregue', value: 'delivered' },
      { name: 'Cancelada', value: 'cancelled' }
    ];
    this.newStatus = '';
    this.statusNotes = '';
    this.showStatusDialog = true;
  }

  public saveStatus() {
    if (!this.newStatus) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Selecione um status' });
      return;
    }

    this.service.updateStatus(this.id, { status: this.newStatus, notes: this.statusNotes }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status atualizado!' });
        this.showStatusDialog = false;
        this.loadOrder();
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao atualizar status'
        });
      }
    });
  }

  // Diagnóstico
  public openDiagnosisDialog() {
    this.diagnosisText = this.order?.diagnosis ?? '';
    this.estimatedCost = this.order?.estimatedCost ?? 0;
    this.diagnosisServices = this.order?.services?.length
      ? this.order.services.map((s: any) => ({ ...s }))
      : [];
    this.diagnosisParts = this.order?.parts?.length
      ? this.order.parts.map((p: any) => ({ ...p }))
      : [];
    this.loadProducts();
    this.showDiagnosisDialog = true;
  }

  private loadProducts() {
    if (this.optionProducts.length) return;
    this.productsService.findAll({ isActive: true, limit: 1000 }).subscribe({
      next: (resp: any) => {
        this.products = resp?.records ?? resp ?? [];
        this.optionProducts = this.products.map((p: any) => ({
          label: `${p.name} (${p.sku})`,
          value: p._id,
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          trackStock: p.trackStock !== false && !p.isVirtual
        }));
      }
    });
  }

  public onPartProductChange(index: number) {
    const part = this.diagnosisParts[index];
    const product = this.optionProducts.find(p => p.value === part.productId);
    if (product) {
      part.name = product.label.replace(/\s*\([^)]*\)\s*$/, '');
      part.unitPrice = product.price;
      this.onPartChange(index);
    }
  }

  public partStockLabel(part: PartModel): string {
    if (!part.productId) return '';
    const product = this.optionProducts.find(p => p.value === part.productId);
    if (!product || !product.trackStock) return '';
    return `Estoque: ${product.stock}`;
  }

  public addService() {
    this.diagnosisServices.push({ description: '', quantity: 1, unitPrice: 0, total: 0 });
  }

  public removeService(index: number) {
    this.diagnosisServices.splice(index, 1);
    this.recalcEstimatedCost();
  }

  public onServiceChange(index: number) {
    const s = this.diagnosisServices[index];
    s.total = s.quantity * s.unitPrice;
    this.recalcEstimatedCost();
  }

  public addPart() {
    this.diagnosisParts.push({ name: '', quantity: 1, unitPrice: 0, total: 0 });
  }

  public removePart(index: number) {
    this.diagnosisParts.splice(index, 1);
    this.recalcEstimatedCost();
  }

  public onPartChange(index: number) {
    const p = this.diagnosisParts[index];
    p.total = p.quantity * p.unitPrice;
    this.recalcEstimatedCost();
  }

  private recalcEstimatedCost() {
    const servicesTotal = this.diagnosisServices.reduce((sum, s) => sum + (s.total || 0), 0);
    const partsTotal = this.diagnosisParts.reduce((sum, p) => sum + (p.total || 0), 0);
    this.estimatedCost = servicesTotal + partsTotal;
  }

  public saveDiagnosis() {
    if (!this.diagnosisText || this.diagnosisText.trim().length < 5) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Descreva o diagnóstico' });
      return;
    }

    const payload: any = {
      diagnosis: this.diagnosisText,
      estimatedCost: this.estimatedCost
    };
    if (this.diagnosisServices.length) payload.services = this.diagnosisServices;
    if (this.diagnosisParts.length) payload.parts = this.diagnosisParts;

    this.service.addDiagnosis(this.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Diagnóstico registrado!' });
        this.showDiagnosisDialog = false;
        this.loadOrder();
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao registrar diagnóstico'
        });
      }
    });
  }

  // Helpers
  public getStatusLabel(status: ServiceOrderStatus): string {
    return ServiceOrderStatusLabels[status] ?? status;
  }

  public getStatusColor(status: ServiceOrderStatus): string {
    return ServiceOrderStatusColors[status] ?? 'info';
  }

  public getPriorityLabel(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityLabels[priority] ?? priority;
  }

  public getPriorityColor(priority: ServiceOrderPriority): string {
    return ServiceOrderPriorityColors[priority] ?? 'info';
  }

  public getHistoryIcon(status: string): string {
    const icons: Record<string, string> = {
      open: 'pi pi-folder-open',
      diagnosing: 'pi pi-search',
      quoted: 'pi pi-file',
      approved: 'pi pi-check',
      in_progress: 'pi pi-wrench',
      completed: 'pi pi-check-circle',
      delivered: 'pi pi-box',
      cancelled: 'pi pi-times-circle'
    };
    return icons[status] ?? 'pi pi-circle';
  }

  public edit() {
    this.router.navigate(['/service-orders/edit/' + this.id]);
  }

  public onBack() {
    this.router.navigate(['/service-orders']);
  }
}
