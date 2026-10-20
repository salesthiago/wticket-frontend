import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../services/service-orders.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import { LeadsService } from '../../../leads/components/services/leads.service';
import { AuthService } from '../../../../services/auth.service';
import { UsersService } from '../../../users/components/services/users.service';
import { ServiceOrderModel } from '../../service-order.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Toast } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [MessageService],
  imports: [
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    InputNumberModule,
    SelectButtonModule,
    Toast,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class FormComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [];

  public order: ServiceOrderModel = {
    customerId: '',
    equipment: { type: '', brand: '', model: '', serialNumber: '', accessories: '', condition: '' },
    reportedIssue: '',
    priority: 'normal',
    technicianId: '',
    estimatedCompletionDate: undefined,
    warrantyDays: 90,
    internalNotes: ''
  };

  public loading = false;
  public customers: any[] = [];
  public leads: any[] = [];

  // Para quem é a OS: cliente já cadastrado ou orçamento de um lead (o lead
  // vira cliente quando o orçamento for aprovado).
  public target: 'customer' | 'lead' = 'customer';
  public targetOptions = [
    { label: 'Cliente', value: 'customer' },
    { label: 'Lead (orçamento)', value: 'lead' }
  ];
  public canUseLeads = false;
  // Edição de um orçamento de lead ainda não aprovado (sem cliente).
  public editingLeadName = '';
  public technicians: any[] = [];

  public optionPriority = [
    { name: 'Baixa', value: 'low' },
    { name: 'Normal', value: 'normal' },
    { name: 'Alta', value: 'high' },
    { name: 'Urgente', value: 'urgent' }
  ];

  protected id: string | null = null;

  constructor(
    private service: ServiceOrdersService,
    private customersService: CustomersService,
    private leadsService: LeadsService,
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Ordens de Serviço', routerLink: '/service-orders' },
      { label: this.id ? 'Editar OS' : 'Nova OS' }
    ];

    this.canUseLeads = this.authService.hasModule('attendance');
    this.loadCustomers();
    this.loadTechnicians();

    if (this.id) {
      this.findById(this.id);
      return;
    }

    if (this.canUseLeads) {
      this.loadLeads();
      const leadId = this.route.snapshot.queryParamMap.get('leadId');
      if (leadId) this.preselectLead(leadId);
    }
  }

  private loadCustomers() {
    this.customersService.findAll({ limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.customers = records.map((c: any) => ({
          name: `${c.name} - ${c.phone}`,
          value: c._id
        }));
      }
    });
  }

  private loadLeads() {
    this.leadsService.findAll({ limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.leads = records
          .filter((l: any) => l.status !== 'converted' && l.status !== 'lost')
          .map((l: any) => ({ name: `${l.name}${l.phone ? ' - ' + l.phone : ''}`, value: l._id }));
      }
    });
  }

  // Vindo de "Criar orçamento" no lead: já seleciona o lead e traz o problema relatado.
  private preselectLead(leadId: string) {
    this.target = 'lead';
    this.order.leadId = leadId;
    this.leadsService.findById(leadId).subscribe({
      next: (lead: any) => {
        // Lead já convertido: o orçamento vai direto para o cliente.
        if (lead.status === 'converted' && lead.convertedTo) {
          this.target = 'customer';
          this.order.customerId = lead.convertedTo._id ?? lead.convertedTo;
          this.order.leadId = undefined;
        } else if (!this.leads.some(l => l.value === lead._id)) {
          this.leads = [{ name: `${lead.name}${lead.phone ? ' - ' + lead.phone : ''}`, value: lead._id }, ...this.leads];
        }
        if (!this.order.reportedIssue && lead.description) {
          this.order.reportedIssue = lead.description;
        }
      }
    });
  }

  private loadTechnicians() {
    this.usersService.findAll({ limit: 1000 }).subscribe({
      next: (resp: any) => {
        const records = resp.records ?? resp;
        this.technicians = records.map((u: any) => ({
          name: u.name,
          value: u._id
        }));
      }
    });
  }

  private findById(id: string) {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.order = {
          ...resp,
          customerId: resp.customerId?._id ?? resp.customerId,
          leadId: resp.leadId?._id ?? resp.leadId,
          technicianId: resp.technicianId?._id ?? resp.technicianId ?? '',
          equipment: resp.equipment ?? { type: '' },
          estimatedCompletionDate: resp.estimatedCompletionDate ? new Date(resp.estimatedCompletionDate) : undefined
        };
        if (!resp.customerId && resp.leadId) {
          this.target = 'lead';
          this.editingLeadName = resp.leadId?.name ?? 'Lead';
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao buscar ordem de serviço'
        });
      }
    });
  }

  public onSubmit(): void {
    const isLead = this.target === 'lead';
    if (isLead && !this.order.leadId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Selecione um lead' });
      return;
    }
    if (!isLead && !this.order.customerId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Selecione um cliente' });
      return;
    }
    // No orçamento de lead o equipamento pode ser definido depois.
    if (!isLead && (!this.order.equipment?.type || this.order.equipment.type.trim().length < 2)) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe o tipo do equipamento' });
      return;
    }
    if (!this.order.reportedIssue || this.order.reportedIssue.trim().length < 5) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Descreva o problema relatado' });
      return;
    }

    this.loading = true;

    const payload: any = {
      equipment: this.order.equipment,
      reportedIssue: this.order.reportedIssue,
      priority: this.order.priority,
      warrantyDays: this.order.warrantyDays,
      internalNotes: this.order.internalNotes,
      estimatedCompletionDate: this.order.estimatedCompletionDate
    };

    if (this.order.technicianId) {
      payload.technicianId = this.order.technicianId;
    }

    if (isLead) {
      if (!this.id) payload.leadId = this.order.leadId;
    } else {
      payload.customerId = this.order.customerId;
    }

    if (this.id) {
      this.service.update(payload, this.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'OS atualizada!' });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao atualizar OS'
          });
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'OS criada com sucesso!' });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao criar OS'
          });
        }
      });
    }
  }

  public onBack() {
    this.router.navigate(['/service-orders']);
  }
}
