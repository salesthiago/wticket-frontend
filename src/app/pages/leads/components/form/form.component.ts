import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { LeadsService } from '../services/leads.service';
import { LeadModel, LeadStatusLabels } from '../../lead.interface';
import { ServiceOrderStatus, ServiceOrderStatusLabels, ServiceOrderStatusColors } from '../../../service-orders/service-order.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  templateUrl: './form.component.html',
  providers: [MessageService],
  imports: [
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    TagModule,
    Toast,
    DatePipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class LeadFormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [];

  public lead: LeadModel = { name: '', phone: '', email: '', description: '', notes: '', status: 'new' };
  public serviceOrders: any[] = [];
  public loading = false;

  // "Convertido" só é atribuído pela conversão/aprovação do orçamento.
  public optionStatus = Object.entries(LeadStatusLabels)
    .filter(([value]) => value !== 'converted')
    .map(([value, name]) => ({ name, value }));

  protected id: string | null = null;

  constructor(
    private service: LeadsService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Leads', routerLink: '/leads' },
      { label: this.id ? 'Editar Lead' : 'Novo Lead' }
    ];
    if (this.id) this.findById(this.id);
  }

  get isConverted(): boolean {
    return this.lead.status === 'converted';
  }

  get convertedCustomerName(): string {
    const c = this.lead.convertedTo;
    return c && typeof c === 'object' ? c.name : '';
  }

  private findById(id: string) {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.lead = resp;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Erro ao buscar lead' });
      }
    });
    this.service.findServiceOrders(id).subscribe({
      next: (orders) => this.serviceOrders = orders
    });
  }

  public onSubmit(createQuote = false): void {
    if (!this.lead.name || this.lead.name.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe o nome do lead' });
      return;
    }
    if (!this.lead.phone || this.lead.phone.trim().length < 8) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe o telefone do lead' });
      return;
    }

    this.loading = true;
    const payload: any = {
      name: this.lead.name,
      phone: this.lead.phone,
      email: this.lead.email,
      description: this.lead.description,
      notes: this.lead.notes
    };
    if (this.id && !this.isConverted) payload.status = this.lead.status;

    const request = this.id ? this.service.update(payload, this.id) : this.service.create(payload);
    request.subscribe({
      next: (saved: any) => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: this.id ? 'Lead atualizado!' : 'Lead criado!' });
        if (createQuote) {
          this.goToQuote(saved._id);
        } else {
          this.onBack();
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Erro ao salvar lead' });
      }
    });
  }

  public goToQuote(leadId = this.id) {
    this.router.navigate(['/service-orders/create'], { queryParams: { leadId } });
  }

  public viewOrder(id: string) {
    this.router.navigate(['/service-orders/view/' + id]);
  }

  public getOrderStatusLabel(status: ServiceOrderStatus): string {
    return ServiceOrderStatusLabels[status] ?? status;
  }

  public getOrderStatusColor(status: ServiceOrderStatus): string {
    return ServiceOrderStatusColors[status] ?? 'info';
  }

  public onBack() {
    this.router.navigate(['/leads']);
  }
}
