import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ServiceOrdersService } from '../services/service-orders.service';
import { CustomersService } from '../../../customers/components/services/customers.service';
import { UsersService } from '../../../users/components/services/users.service';
import { ServiceOrderModel } from '../../service-order.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
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

    this.loadCustomers();
    this.loadTechnicians();

    if (this.id) {
      this.findById(this.id);
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
          technicianId: resp.technicianId?._id ?? resp.technicianId ?? '',
          equipment: resp.equipment ?? { type: '' },
          estimatedCompletionDate: resp.estimatedCompletionDate ? new Date(resp.estimatedCompletionDate) : undefined
        };
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
    if (!this.order.customerId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Selecione um cliente' });
      return;
    }
    if (!this.order.equipment?.type || this.order.equipment.type.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Informe o tipo do equipamento' });
      return;
    }
    if (!this.order.reportedIssue || this.order.reportedIssue.trim().length < 5) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Descreva o problema relatado' });
      return;
    }

    this.loading = true;

    const payload: any = {
      customerId: this.order.customerId,
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
