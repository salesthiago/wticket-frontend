import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PermissionService } from '../services/permission.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext"
import { HeaderComponent } from '../../../../layout/header/header.component';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { PasswordModule } from 'primeng/password'
import { PermissionModel } from '../../permission.interface';
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
    HeaderComponent,
    SidebarComponent,
    PasswordModule
]
})
export class FormComponent {
  public permission: PermissionModel = {
    _id: null,
    name: '',
    sessions: [],
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
    private service: PermissionService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.findById(id)
    }
  }
  findById(id: string) {
    this.service.findById(id).subscribe({
        next: (resp: any) => {
          this.permission = resp
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.error?.message || 'Erro ao buscar dados do usuario'
          });
        },
        complete: () => {
          this.loading = false;
        }
    })
  }
  onSubmit(): void {
    this.loading = true;
    const { _id } = this.permission

    if (_id) {
      if (this.password !== this.confirmPassword) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'As senhas não conferem'
          });
        return
      }
      this.service.update(this.permission, _id).subscribe({
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

      this.service.create(this.permission).subscribe({
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
    this.router.navigate(['/permissions']);
  }
}
