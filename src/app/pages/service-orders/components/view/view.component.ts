import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../services/service-orders.service';
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
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-view',
  standalone: true,
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
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

  private id: string = '';

  constructor(
    private service: ServiceOrdersService,
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.loadOrder();
    }
  }

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
      ? [...this.order.services]
      : [];
    this.diagnosisParts = this.order?.parts?.length
      ? [...this.order.parts]
      : [];
    this.showDiagnosisDialog = true;
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
