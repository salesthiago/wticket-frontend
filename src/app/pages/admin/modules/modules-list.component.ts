import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { ModuleService, ModuleDef } from '../../../services/module.service';

@Component({
  selector: 'app-admin-modules-list',
  standalone: true,
  templateUrl: './modules-list.component.html',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    ToastModule,
    SidebarComponent
  ]
})
export class ModulesListComponent implements OnInit {
  modules: ModuleDef[] = [];
  loading = false;
  editingId: string | null = null;
  draftPrice = 0;

  constructor(
    private moduleService: ModuleService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.moduleService.findAll(false).subscribe({
      next: (m) => { this.modules = m; this.loading = false; },
      error: () => { this.loading = false; this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar' }); }
    });
  }

  startEdit(m: ModuleDef): void {
    this.editingId = m._id;
    this.draftPrice = m.price ?? 0;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  savePrice(m: ModuleDef): void {
    this.moduleService.update(m._id, { price: this.draftPrice }).subscribe({
      next: () => {
        this.editingId = null;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Preço atualizado' });
        this.load();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha' })
    });
  }

  toggleActive(m: ModuleDef): void {
    this.moduleService.update(m._id, { isActive: !m.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha' })
    });
  }
}
