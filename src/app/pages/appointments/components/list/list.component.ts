import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AppointmentsService } from '../services/appointments.service';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmationService, MenuItem } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppointmentModel, AppointmentStatusLabels, AppointmentStatusColors } from '../../appointment.interface';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService],
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SidebarComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DatePipe,
    ConfirmDialog,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbModule
  ]
})
export class ListComponent {
  public items: AppointmentModel[] = [];
  public loading: boolean = false;
  public search: string = '';
  public totalRecords: number = 0;
  public rows: number = 10;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Agendamentos' }];
  public first: number = 0;

  public statusLabels = AppointmentStatusLabels;
  public statusColors = AppointmentStatusColors;

  private searchSubject = new Subject<string>();

  constructor(
    private service: AppointmentsService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    this.setupSearch();
  }

  ngOnInit() {
    this.findAppointments();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  public searchAppointment(event: any) {
    const searchTerm = this.search.trim();

    if (searchTerm.length < 3) {
      if (searchTerm.length === 0) {
        this.findAppointments();
      }
      return;
    }

    this.searchSubject.next(searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (searchTerm.length < 3) return;

    this.loading = true;
    this.service.findAll({ search: searchTerm, page: 1, perPage: this.rows }).subscribe({
      next: (resp: any) => {
        this.items = resp.data || resp;
        this.totalRecords = resp.total || this.items.length;
        this.loading = false;
      },
      error: (err: any) => {
        console.log('Erro ao buscar agendamentos', err);
        this.loading = false;
      }
    });
  }

  public clearSearch() {
    this.search = '';
    this.findAppointments();
  }

  public add() {
    this.router.navigate(['/appointments/create']);
  }

  public findAppointments(event?: any) {
    this.loading = true;

    const page = event ? (event.first / event.rows) + 1 : 1;
    const perPage = event ? event.rows : this.rows;

    this.service.findAll({ page, perPage }).subscribe({
      next: (resp: any) => {
        this.items = resp.data || resp;
        this.totalRecords = resp.total || this.items.length;
        this.loading = false;
      },
      error: (err: any) => {
        console.log('Erro ao listar agendamentos', err);
        this.loading = false;
      }
    });
  }

  public edit(id: any) {
    this.router.navigate(['/appointments/edit/' + id]);
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja deletar este agendamento?',
      header: 'Deletar Agendamento',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Não',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Sim'
      },
      accept: () => {
        this.service.delete(id).subscribe({
          next: () => {
            this.findAppointments();
          },
          error: (err: any) => {
            console.log('Erro ao deletar agendamento', err);
          }
        });
      }
    });
  }

  public confirmCancel(id: string) {
    this.confirmationService.confirm({
      message: 'Deseja cancelar este agendamento?',
      header: 'Cancelar Agendamento',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Não',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'warning',
        label: 'Sim, cancelar'
      },
      accept: () => {
        this.service.cancel(id, 'Cancelado pelo usuário').subscribe({
          next: () => {
            this.findAppointments();
          },
          error: (err: any) => {
            console.log('Erro ao cancelar agendamento', err);
          }
        });
      }
    });
  }

  public getContactName(appointment: AppointmentModel): string {
    if (typeof appointment.contactId === 'object' && appointment.contactId !== null) {
      return appointment.contactId.name;
    }
    return 'N/A';
  }

  public getContactPhone(appointment: AppointmentModel): string {
    if (typeof appointment.contactId === 'object' && appointment.contactId !== null) {
      return appointment.contactId.phone;
    }
    return appointment.phone;
  }

  public getAssignedToName(appointment: AppointmentModel): string {
    if (typeof appointment.assignedTo === 'object' && appointment.assignedTo !== null) {
      return appointment.assignedTo.name;
    }
    return 'Não atribuído';
  }

  public getStatusLabel(status: string): string {
    return this.statusLabels[status as keyof typeof this.statusLabels] || status;
  }

  public getStatusColor(status: string): string {
    return this.statusColors[status as keyof typeof this.statusColors] || 'info';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
