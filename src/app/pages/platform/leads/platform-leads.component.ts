import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { PlatformService } from '../services/platform.service';
import {
  PlatformLead,
  PlatformLeadImportResult,
  PlatformLeadImportRow,
  PlatformLeadInput,
  PlatformLeadStatus,
  PlatformLeadStatusColors,
  PlatformLeadStatusLabels,
  PlatformLeadStatusOrder,
  PlatformLeadStatusSeverity
} from '../platform.interface';
import { LEAD_CSV_TEMPLATE, parseLeadCsv, rowProblem } from './lead-csv';

type ViewMode = 'kanban' | 'list';

interface KanbanColumn {
  status: PlatformLeadStatus;
  label: string;
  color: string;
  leads: PlatformLead[];
}

const VIEW_MODE_KEY = 'platformLeadsView';

const emptyForm = (): PlatformLeadInput => ({
  name: '', company: '', phone: '', email: '', status: 'new', segment: '', notes: ''
});

@Component({
  selector: 'app-platform-leads',
  standalone: true,
  templateUrl: './platform-leads.component.html',
  styleUrls: ['./platform-leads.component.scss'],
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule, FormsModule, DragDropModule, ButtonModule, CardModule, TableModule, TagModule,
    InputTextModule, IconFieldModule, InputIconModule, SelectModule, SelectButtonModule, AutoCompleteModule,
    TextareaModule, DialogModule, TooltipModule, MessageModule, ToastModule, ConfirmDialog, SidebarComponent
  ]
})
export class PlatformLeadsComponent implements OnInit {
  leads: PlatformLead[] = [];
  columns: KanbanColumn[] = [];
  segments: string[] = [];
  loading = false;

  view: ViewMode = 'kanban';
  viewOptions = [
    { value: 'kanban', icon: 'pi pi-th-large', tooltip: 'Kanban' },
    { value: 'list', icon: 'pi pi-list', tooltip: 'Lista' }
  ];

  search = '';
  statusFilter: PlatformLeadStatus | '' = '';
  segmentFilter = '';

  statusOptions = PlatformLeadStatusOrder.map(value => ({ value, label: PlatformLeadStatusLabels[value] }));
  statusFilterOptions = [{ value: '', label: 'Todos os status' }, ...this.statusOptions];

  // Cadastro/edição
  formVisible = false;
  saving = false;
  editingId: string | null = null;
  form: PlatformLeadInput = emptyForm();
  segmentSuggestions: string[] = [];

  // Importação CSV
  importVisible = false;
  importing = false;
  importFileName = '';
  importRows: PlatformLeadImportRow[] = [];
  importIgnoredHeaders: string[] = [];
  importMissingRequired: string[] = [];
  importResult: PlatformLeadImportResult | null = null;

  constructor(
    private service: PlatformService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'list' || saved === 'kanban') this.view = saved;
    } catch { /* storage indisponível: mantém o padrão */ }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.findLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.loading = false;
        this.buildColumns();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar leads' });
      }
    });
    this.service.getSegments().subscribe({ next: (s) => this.segments = s });
  }

  onViewChange(): void {
    try { localStorage.setItem(VIEW_MODE_KEY, this.view); } catch { /* ignora */ }
    this.buildColumns();
  }

  get segmentFilterOptions() {
    return [{ value: '', label: 'Todos os ramos' }, ...this.segments.map(s => ({ value: s, label: s }))];
  }

  get filtered(): PlatformLead[] {
    const term = this.search.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    return this.leads.filter(l => {
      // No kanban o status vira coluna — o filtro de status só vale na lista.
      if (this.view === 'list' && this.statusFilter && l.status !== this.statusFilter) return false;
      if (this.segmentFilter && l.segment !== this.segmentFilter) return false;
      if (!term) return true;
      return l.name.toLowerCase().includes(term)
        || (l.company || '').toLowerCase().includes(term)
        || (l.email || '').toLowerCase().includes(term)
        || (!!digits && l.phone.replace(/\D/g, '').includes(digits));
    });
  }

  buildColumns(): void {
    const items = this.filtered;
    this.columns = PlatformLeadStatusOrder.map(status => ({
      status,
      label: PlatformLeadStatusLabels[status],
      color: PlatformLeadStatusColors[status],
      leads: items.filter(l => l.status === status)
    }));
  }

  drop(event: CdkDragDrop<PlatformLead[]>, target: KanbanColumn): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const lead = event.previousContainer.data[event.previousIndex];
    const previous = lead.status;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    lead.status = target.status;

    this.service.updateLead(lead._id, { status: target.status }).subscribe({
      next: (updated) => Object.assign(lead, updated),
      error: (err) => {
        lead.status = previous;
        this.buildColumns();
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Não foi possível mover o lead' });
      }
    });
  }

  // ─── Cadastro / edição ────────────────────────────────────────────────────

  openNew(status: PlatformLeadStatus = 'new'): void {
    this.editingId = null;
    this.form = { ...emptyForm(), status };
    this.formVisible = true;
  }

  edit(lead: PlatformLead): void {
    this.editingId = lead._id;
    this.form = {
      name: lead.name, company: lead.company || '', phone: lead.phone, email: lead.email || '',
      status: lead.status, segment: lead.segment || '', notes: lead.notes || ''
    };
    this.formVisible = true;
  }

  filterSegments(event: { query: string }): void {
    const q = event.query.toLowerCase();
    this.segmentSuggestions = this.segments.filter(s => s.toLowerCase().includes(q));
  }

  save(): void {
    if (!this.form.name.trim() || this.form.phone.replace(/\D/g, '').length < 8) {
      this.messageService.add({ severity: 'warn', summary: 'Campos obrigatórios', detail: 'Informe nome e telefone' });
      return;
    }
    this.saving = true;
    const request = this.editingId
      ? this.service.updateLead(this.editingId, this.form)
      : this.service.createLead(this.form);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.formVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: this.editingId ? 'Lead atualizado' : 'Lead cadastrado' });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao salvar lead' });
      }
    });
  }

  removeEditing(): void {
    const lead = this.leads.find(l => l._id === this.editingId);
    if (lead) this.remove(lead);
  }

  remove(lead: PlatformLead): void {
    this.confirmationService.confirm({
      header: 'Excluir lead',
      message: `Excluir o lead ${lead.name}? Esta ação não pode ser desfeita.`,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      accept: () => this.service.deleteLead(lead._id).subscribe({
        next: () => {
          this.formVisible = false;
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lead excluído' });
          this.load();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao excluir' })
      })
    });
  }

  // ─── Importação CSV ───────────────────────────────────────────────────────

  openImport(): void {
    this.resetImport();
    this.importVisible = true;
  }

  resetImport(): void {
    this.importFileName = '';
    this.importRows = [];
    this.importIgnoredHeaders = [];
    this.importMissingRequired = [];
    this.importResult = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.resetImport();
    this.importFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseLeadCsv(String(reader.result || ''));
      this.importRows = parsed.rows;
      this.importIgnoredHeaders = parsed.ignoredHeaders;
      this.importMissingRequired = parsed.missingRequired;
    };
    reader.onerror = () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível ler o arquivo' });
    reader.readAsText(file, 'utf-8');
  }

  get importValidCount(): number {
    return this.importRows.filter(r => !rowProblem(r)).length;
  }

  rowProblem(row: PlatformLeadImportRow): string | null {
    return rowProblem(row);
  }

  downloadTemplate(): void {
    const blob = new Blob(['﻿' + LEAD_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  confirmImport(): void {
    if (!this.importRows.length) return;
    this.importing = true;
    this.service.importLeads(this.importRows).subscribe({
      next: (result) => {
        this.importing = false;
        this.importResult = result;
        this.messageService.add({
          severity: result.created ? 'success' : 'warn',
          summary: 'Importação concluída',
          detail: `${result.created} lead(s) importado(s)`
        });
        if (result.created) this.load();
      },
      error: (err) => {
        this.importing = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha na importação' });
      }
    });
  }

  // ─── Helpers de template ──────────────────────────────────────────────────

  statusLabel(s: PlatformLeadStatus): string {
    return PlatformLeadStatusLabels[s] ?? s;
  }

  statusSeverity(s: PlatformLeadStatus) {
    return PlatformLeadStatusSeverity[s] ?? 'info';
  }

  /** Link do WhatsApp; assume DDI 55 quando o número vier só com DDD. */
  whatsappUrl(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits.length <= 11 ? '55' + digits : digits}`;
  }
}
