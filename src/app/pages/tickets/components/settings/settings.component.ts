import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TicketCategoryService } from '../services/ticket-category.service';
import { TicketSubjectService } from '../services/ticket-subject.service';
import { TicketStatusService } from '../services/ticket-status.service';

@Component({
  selector: 'app-ticket-settings',
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
    TextareaModule,
    ColorPickerModule,
    ToggleSwitchModule,
    ToastModule,
    BreadcrumbModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    SelectModule,
    InputNumberModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class TicketSettingsComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [
    { label: 'Tickets', routerLink: '/tickets/list' },
    { label: 'Configurações' }
  ];

  // Categorias
  categories: any[] = [];
  categoryDialog = false;
  categoryForm: any = { name: '', description: '', color: '#6c757d', isActive: true };
  editingCategoryId: string | null = null;
  categoryLoading = false;

  // Assuntos
  subjects: any[] = [];
  subjectDialog = false;
  subjectForm: any = { name: '', description: '', categoryId: '', isActive: true };
  editingSubjectId: string | null = null;
  subjectLoading = false;

  // Status
  statuses: any[] = [];
  statusDialog = false;
  statusForm: any = { name: '', label: '', color: '#6c757d', isDefault: false, order: 0, isActive: true };
  editingStatusId: string | null = null;
  statusLoading = false;

  categoryOptions: any[] = [];

  constructor(
    private categoryService: TicketCategoryService,
    private subjectService: TicketSubjectService,
    private statusService: TicketStatusService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSubjects();
    this.loadStatuses();
  }

  // --- Categorias ---
  loadCategories(): void {
    this.categoryService.findAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.categoryOptions = data.map(c => ({ label: c.name, value: c._id }));
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao carregar categorias' })
    });
  }

  openCategoryDialog(category?: any): void {
    if (category) {
      this.editingCategoryId = category._id;
      this.categoryForm = { name: category.name, description: category.description, color: category.color, isActive: category.isActive };
    } else {
      this.editingCategoryId = null;
      this.categoryForm = { name: '', description: '', color: '#6c757d', isActive: true };
    }
    this.categoryDialog = true;
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nome é obrigatório' });
      return;
    }
    this.categoryLoading = true;
    const action = this.editingCategoryId
      ? this.categoryService.update(this.editingCategoryId, this.categoryForm)
      : this.categoryService.create(this.categoryForm);

    action.subscribe({
      next: () => {
        this.categoryDialog = false;
        this.categoryLoading = false;
        this.loadCategories();
        this.messageService.add({ severity: 'success', summary: 'Categoria salva com sucesso' });
      },
      error: () => {
        this.categoryLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao salvar categoria' });
      }
    });
  }

  deleteCategory(id: string, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja remover esta categoria?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryService.delete(id).subscribe({
          next: () => {
            this.loadCategories();
            this.messageService.add({ severity: 'success', summary: 'Categoria removida' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao remover categoria' })
        });
      }
    });
  }

  // --- Assuntos ---
  loadSubjects(): void {
    this.subjectService.findAll().subscribe({
      next: (data) => this.subjects = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao carregar assuntos' })
    });
  }

  openSubjectDialog(subject?: any): void {
    if (subject) {
      this.editingSubjectId = subject._id;
      this.subjectForm = {
        name: subject.name,
        description: subject.description,
        categoryId: subject.categoryId?._id || subject.categoryId,
        isActive: subject.isActive
      };
    } else {
      this.editingSubjectId = null;
      this.subjectForm = { name: '', description: '', categoryId: '', isActive: true };
    }
    this.subjectDialog = true;
  }

  saveSubject(): void {
    if (!this.subjectForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nome é obrigatório' });
      return;
    }
    this.subjectLoading = true;
    const action = this.editingSubjectId
      ? this.subjectService.update(this.editingSubjectId, this.subjectForm)
      : this.subjectService.create(this.subjectForm);

    action.subscribe({
      next: () => {
        this.subjectDialog = false;
        this.subjectLoading = false;
        this.loadSubjects();
        this.messageService.add({ severity: 'success', summary: 'Assunto salvo com sucesso' });
      },
      error: () => {
        this.subjectLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro ao salvar assunto' });
      }
    });
  }

  deleteSubject(id: string, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseja remover este assunto?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.subjectService.delete(id).subscribe({
          next: () => {
            this.loadSubjects();
            this.messageService.add({ severity: 'success', summary: 'Assunto removido' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erro ao remover assunto' })
        });
      }
    });
  }

  // --- Status ---
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
        order: status.order,
        isActive: status.isActive
      };
    } else {
      this.editingStatusId = null;
      this.statusForm = { name: '', label: '', color: '#6c757d', isDefault: false, order: 0, isActive: true };
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
