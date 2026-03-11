import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { UsersService } from '../services/users.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserModel } from '../../user.interface';
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext"
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { PasswordModule } from 'primeng/password';
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
    SidebarComponent,
    PasswordModule,
    BreadcrumbModule
]
})
export class FormComponent {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Usuários', routerLink: '/users' }, { label: 'Novo Usuário' }];

  public user: UserModel = {
    id: '',
    email: '',
    password: '',
    name: '',
    role: 'default',
    status: 'enabled'
  };
  public password: string = '';
  public optionStatus = [
    { name: 'Ativo', value: 'enabled'},
    { name: 'Bloqueado', value: 'disabled'},
  ]
  public optionRole = [
    { name: 'Administrador', value: 'administrator'},
    { name: 'Padrão', value: 'default'},
  ]
  public confirmPassword: string = ''
  public loading = false;

  constructor(
    private service: UsersService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.findById(id)
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.breadcrumbItems = [
      { label: 'Usuários', routerLink: '/users' },
      { label: id ? 'Editar Usuário' : 'Novo Usuário' }
    ];
  }

  findById(id: string) {
    this.service.findById(id).subscribe({
        next: (resp: any) => {
          this.user = resp
          this.user.id = resp._id
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error?.message || 'Erro ao buscar dados do usuario'
          });
        },
        complete: () => {
          this.loading = false;
        }
    })
  }
  onSubmit(): void {
    this.loading = true;
    const { id, role } = this.user
    const data = {
      role,
      ...this.user
    }

    console.log(data, 'data')
    if (this.user.name.length < 3) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Nome inválido'
          });
        return
      }
    if (this.user.email.length < 3) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'E-mail inválido'
          });
        return
      }
    if (id) {
      if (this.password && this.password !== this.confirmPassword) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'As senhas não conferem'
          });
        return
      }
      // Inclui a senha no objeto data apenas se foi preenchida
      if (this.password) {
        data.password = this.password;
      } else {
        delete data.password; // Remove password vazio para não sobrescrever
      }
      this.service.update(data, id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Usuário Atualizado com sucesso!'
          });
          this.onBack()
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao criar usuario'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      if (!this.password) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Informe uma senha'
          });
        return
      }
      if (this.password && !this.confirmPassword) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Confirme a senha digitada'
          });
        return
      }
      if (this.password !== this.confirmPassword) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'As senhas não conferem'
          });
        return
      }
      // Inclui a senha no objeto data para criação
      data.password = this.password;
      this.service.create(data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Usuário criado com sucesso!'
          });
          this.onBack()
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao atualizar usuario'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  onBack() {
    this.router.navigate(['/users']);
  }
}
