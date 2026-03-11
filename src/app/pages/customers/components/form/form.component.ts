import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { CustomersService } from '../services/customers.service';
import { CustomerModel } from '../../customer.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
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
    Toast,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class FormComponent {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Clientes', routerLink: '/customers' }, { label: 'Novo Cliente' }];

  public customer: CustomerModel = {
    name: '',
    phone: '',
    email: '',
    documentType: undefined,
    document: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'BR'
    }
  };

  public loading = false;

  public optionDocumentType = [
    { name: 'CPF', value: 'cpf' },
    { name: 'CNPJ', value: 'cnpj' }
  ];

  protected id: string | null = null;

  constructor(
    private service: CustomersService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.findById(this.id);
    }
  }

  ngOnInit(): void {
    this.breadcrumbItems = [
      { label: 'Clientes', routerLink: '/customers' },
      { label: this.id ? 'Editar Cliente' : 'Novo Cliente' }
    ];
  }

  private findById(id: string) {
    this.loading = true;
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.customer = {
          ...resp,
          id: resp._id,
          address: resp.address ?? {}
        };
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao buscar cliente'
        });
      }
    });
  }

  public onSubmit(): void {
    if (!this.customer.name || this.customer.name.trim().length < 2) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Nome inválido' });
      return;
    }
    if (!this.customer.phone || this.customer.phone.trim().length < 8) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Telefone inválido' });
      return;
    }

    this.loading = true;

    if (this.id) {
      this.service.update(this.customer, this.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cliente atualizado!' });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao atualizar cliente'
          });
        }
      });
    } else {
      this.service.create(this.customer).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Cliente cadastrado!' });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.error?.message || 'Erro ao cadastrar cliente'
          });
        }
      });
    }
  }

  public onBack() {
    this.router.navigate(['/customers']);
  }
}
