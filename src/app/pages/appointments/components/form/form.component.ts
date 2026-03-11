import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { AppointmentsService } from '../services/appointments.service';
import { ContactService } from '../../../contacts/components/services/contact.service';
import { UsersService } from '../../../users/components/services/users.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppointmentModel } from '../../appointment.interface';
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { DatePickerModule } from "primeng/datepicker";
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class FormComponent {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Agendamentos', routerLink: '/appointments' }, { label: 'Novo Agendamento' }];

  public appointment: any = {
    contactId: '',
    phone: '',
    scheduledDate: '',
    scheduledTime: '',
    description: '',
    service: '',
    assignedTo: '',
    status: 'scheduled',
    notes: ''
  };

  public contacts: any[] = [];
  public users: any[] = [];
  public loading = false;
  public loadingContacts = false;
  public loadingUsers = false;
  public isEditMode = false;
  public appointmentId: string | null = null;

  public optionStatus = [
    { name: 'Agendado', value: 'scheduled' },
    { name: 'Confirmado', value: 'confirmed' },
    { name: 'Em Andamento', value: 'in_progress' },
    { name: 'Concluído', value: 'completed' },
    { name: 'Cancelado', value: 'cancelled' },
    { name: 'Não Compareceu', value: 'no_show' }
  ];

  constructor(
    private service: AppointmentsService,
    private contactService: ContactService,
    private usersService: UsersService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.appointmentId = id;
      this.findById(id);
    }
    this.loadContacts();
    this.loadUsers();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.breadcrumbItems = [
      { label: 'Agendamentos', routerLink: '/appointments' },
      { label: id ? 'Editar Agendamento' : 'Novo Agendamento' }
    ];
  }

  loadContacts() {
    this.loadingContacts = true;
    this.contactService.findAll({}).subscribe({
      next: (resp: any) => {
        this.contacts = (resp.data || resp).map((contact: any) => ({
          name: contact.name,
          value: contact._id,
          phone: contact.phone
        }));
        this.loadingContacts = false;
      },
      error: (error: any) => {
        this.loadingContacts = false;
        console.error('Erro ao carregar contatos', error);
      }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.usersService.findAll({}).subscribe({
      next: (resp: any) => {
        this.users = (resp.data || resp).map((user: any) => ({
          name: user.name,
          value: user._id
        }));
        this.loadingUsers = false;
      },
      error: (error: any) => {
        this.loadingUsers = false;
        console.error('Erro ao carregar usuários', error);
      }
    });
  }

  onContactChange(event: any) {
    const selectedContact = this.contacts.find(c => c.value === event.value);
    if (selectedContact) {
      this.appointment.phone = selectedContact.phone;
    }
  }

  findById(id: string) {
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.appointment = {
          contactId: typeof resp.contactId === 'object' ? resp.contactId._id : resp.contactId,
          phone: resp.phone,
          scheduledDate: new Date(resp.scheduledDate),
          scheduledTime: resp.scheduledTime,
          description: resp.description,
          service: resp.service || '',
          assignedTo: typeof resp.assignedTo === 'object' ? resp.assignedTo?._id : resp.assignedTo,
          status: resp.status,
          notes: resp.notes || ''
        };
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.message || 'Erro ao buscar dados do agendamento'
        });
      }
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;

    const data = {
      contactId: this.appointment.contactId,
      phone: this.appointment.phone,
      scheduledDate: this.appointment.scheduledDate,
      scheduledTime: this.appointment.scheduledTime,
      description: this.appointment.description,
      service: this.appointment.service,
      assignedTo: this.appointment.assignedTo || undefined,
      status: this.appointment.status,
      notes: this.appointment.notes
    };

    if (this.isEditMode && this.appointmentId) {
      this.service.update(data, this.appointmentId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Agendamento atualizado com sucesso!'
          });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao atualizar agendamento'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.service.create(data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Agendamento criado com sucesso!'
          });
          this.onBack();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao criar agendamento'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.appointment.contactId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione um contato'
      });
      return false;
    }

    if (!this.appointment.phone) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Telefone é obrigatório'
      });
      return false;
    }

    if (!this.appointment.scheduledDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione uma data'
      });
      return false;
    }

    if (!this.appointment.scheduledTime) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Informe o horário'
      });
      return false;
    }

    if (!this.appointment.description || this.appointment.description.length < 3) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Descrição deve ter no mínimo 3 caracteres'
      });
      return false;
    }

    return true;
  }

  onBack() {
    this.router.navigate(['/appointments']);
  }
}
