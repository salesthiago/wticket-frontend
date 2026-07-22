import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProjectStatusService } from '../services/project-status.service';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-project-settings',
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ColorPickerModule,
    ToggleSwitchModule,
    ToastModule,
    BreadcrumbModule,
    InputNumberModule,
    ConfirmDialogModule,
    TooltipModule,
    SidebarComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Projetos', routerLink: '/projects' },
    { label: 'Status' }
  ];

  statuses: any[] = [];
  statusDialog = false;
  statusForm: any = { name: '', label: '', color: '#6c757d', isDefault: false, isClosingStatus: false, order: 0, isActive: true };
  editingStatusId: string | null = null;
  statusLoading = false;

  constructor(
    private statusService: ProjectStatusService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.statusService.findAll().subscribe({
      next: (data) => this.statuses = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao carregar status' })
    });
  }

  openStatusDialog(status?: any): void {
    if (status) {
      this.editingStatusId = status._id;
      this.statusForm = {
        name: status.name,
        label: status.label,
        color: status.color,
        isDefault: status.isDefault,
        isClosingStatus: status.isClosingStatus,
        order: status.order,
        isActive: status.isActive
      };
    } else {
      this.editingStatusId = null;
      this.statusForm = { name: '', label: '', color: '#6c757d', isDefault: false, isClosingStatus: false, order: 0, isActive: true };
    }
    this.statusDialog = true;
  }

  saveStatus(): void {
    if (!this.statusForm.name.trim() || !this.statusForm.label.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nome e label são obrigatórios' });
      return;
    }
    this.statusLoading = true;
    const action = this.editingStatusId
      ? this.statusService.update(this.editingStatusId, this.statusForm)
      : this.statusService.create(this.statusForm);

    action.subscribe({
      next: () => {
        this.statusDialog = false;
        this.statusLoading = false;
        this.loadStatuses();
        this.messageService.add({ severity: 'success', summary: 'Status salvo com sucesso' });
      },
      error: () => {
        this.statusLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao salvar status' });
      }
    });
  }

  setDefaultStatus(id: string): void {
    this.statusService.setDefault(id).subscribe({
      next: () => {
        this.loadStatuses();
        this.messageService.add({ severity: 'success', summary: 'Status padrão definido' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao definir status padrão' })
    });
  }

  deleteStatus(id: string, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja remover este status?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.statusService.delete(id).subscribe({
          next: () => {
            this.loadStatuses();
            this.messageService.add({ severity: 'success', summary: 'Status removido' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao remover status' })
        });
      }
    });
  }
}
