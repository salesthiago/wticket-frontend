import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { UsersService } from '../services/users.service';
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
  public items: any = [];
  public loading: boolean = false;
  public search: string = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Usuários' }];

  // Subject para controlar o debounce da busca
  private searchSubject = new Subject<string>();

  constructor(
    private service: UsersService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    // Configurar o debounce para a busca
    this.setupSearch();
  }

  ngOnInit() {
    this.findUsers();
  }

  // Configura o observable com debounce
  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(500), // Aguarda 500ms após a última digitação
      distinctUntilChanged() // Só emite se o valor mudou
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  // Função chamada quando o usuário digita no campo de busca
  public searchUser(event: any) {
    const searchTerm = this.search.trim();

    // Se tiver menos de 3 caracteres, limpa a busca e carrega todos os usuários
    if (searchTerm.length < 3) {
      if (searchTerm.length === 0) {
        // Se o campo estiver vazio, recarrega a lista completa
        this.findUsers();
      }
      return;
    }

    // Dispara a busca com debounce
    this.searchSubject.next(searchTerm);
  }

  // Função que executa a busca de fato
  private performSearch(searchTerm: string) {
    if (searchTerm.length < 3) return;

    this.loading = true;
    this.service.findAll({ search: searchTerm }).subscribe({
      next: (resp: any) => {
        this.items = resp;
        this.loading = false;
      },
      error: (err: any) => {
        console.log('Erro ao buscar usuários', err);
        this.loading = false;
      }
    });
  }

  // Função para limpar a busca
  public clearSearch() {
    this.search = '';
    this.findUsers();
  }

  public add() {
    this.router.navigate(['/users/create']);
  }

  public findUsers() {
    this.loading = true;
    this.service.findAll({}).subscribe({
      next: (resp: any) => {
        this.items = resp;
        this.loading = false;
      },
      error: (err: any) => {
        console.log('Erro ao listar usuários', err);
        this.loading = false;
      }
    });
  }

  public edit(id: any) {
    this.router.navigate(['/users/edit/' + id]);
  }

  public confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Realmente deseja deletar este usuário?',
      header: 'Deletar Usuário',
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
            this.findUsers(); // Recarrega a lista após deletar
          },
          error: (err: any) => {
            console.log('Erro ao deletar usuário', err);
          }
        });
      }
    });
  }
  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
