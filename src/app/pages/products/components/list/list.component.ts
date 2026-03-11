import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ProductsService } from '../services/products.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ConfirmationService, MessageService],
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ConfirmDialog,
    Toast,
    TagModule,
    CurrencyPipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class ListComponent implements OnInit, OnDestroy {
  public items: any[] = [];
  public loading = false;
  public search = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Produtos' }];

  private searchSubject = new Subject<string>();

  constructor(
    private service: ProductsService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => this.loadProducts({ search: term }));
  }

  ngOnInit() {
    this.loadProducts({});
  }

  public loadProducts(params: any) {
    this.loading = true;
    this.service.findAll(params).subscribe({
      next: (resp: any) => {
        this.items = resp.records ?? resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  public onSearch() {
    const term = this.search.trim();
    if (term.length === 0) {
      this.loadProducts({});
      return;
    }
    if (term.length < 2) return;
    this.searchSubject.next(term);
  }

  public clearSearch() {
    this.search = '';
    this.loadProducts({});
  }

  public add() {
    this.router.navigate(['/products/create']);
  }

  public edit(id: string) {
    this.router.navigate(['/products/edit/' + id]);
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja deletar este produto?',
      header: 'Deletar Produto',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Sim' },
      accept: () => {
        this.service.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto deletado!' });
            this.loadProducts({});
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível deletar o produto.' });
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
