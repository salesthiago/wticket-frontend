import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { NfseService } from '../services/nfse.service';
import { NfseServiceCode } from '../../nfse.interface';

@Component({
  selector: 'app-nfse-service-codes-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ConfirmDialog,
    Toast,
    TagModule,
    TooltipModule,
    BreadcrumbModule,
    SidebarComponent
  ]
})
export class ServiceCodesListComponent implements OnInit, OnDestroy {
  items: NfseServiceCode[] = [];
  loading = false;
  search = '';
  total = 0;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'NFS-e' }, { label: 'Códigos de Serviço' }];

  private searchSubject = new Subject<string>();

  constructor(
    private nfse: NfseService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(term => this.load({ search: term }));
  }

  ngOnInit() {
    this.load({});
  }

  load(params: { search?: string; page?: number; limit?: number } = {}) {
    this.loading = true;
    this.nfse.listServiceCodes({ ...params, limit: params.limit ?? 20 }).subscribe({
      next: (resp) => {
        this.items = resp?.records || [];
        this.total = resp?.total || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    const term = this.search.trim();
    if (term.length === 0) { this.load({}); return; }
    if (term.length < 2) return;
    this.searchSubject.next(term);
  }

  clearSearch() {
    this.search = '';
    this.load({});
  }

  add() {
    this.router.navigate(['/nfse/service-codes/create']);
  }

  edit(id: string) {
    this.router.navigate(['/nfse/service-codes/edit', id]);
  }

  confirmDelete(item: NfseServiceCode) {
    this.confirmationService.confirm({
      message: `Desativar o código "${item.cTribNac} — ${item.descricao}"?`,
      header: 'Desativar código',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Desativar' },
      accept: () => {
        this.nfse.deleteServiceCode(item._id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Código desativado' });
            this.load({ search: this.search });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: err?.error?.message || 'Falha ao desativar código'
            });
          }
        });
      }
    });
  }

  hasRetencao(item: NfseServiceCode): string {
    const r = item.retencoes;
    if (!r) return '—';
    const parts: string[] = [];
    if (r.iss) parts.push('ISS');
    if (r.pis?.retido) parts.push('PIS');
    if (r.cofins?.retido) parts.push('COFINS');
    if (r.irrf?.retido) parts.push('IRRF');
    if (r.csll?.retido) parts.push('CSLL');
    if (r.cp?.retido) parts.push('CP');
    return parts.length ? parts.join(', ') : '—';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
