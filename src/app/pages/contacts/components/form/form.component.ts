import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ContactService } from '../services/contact.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactModel } from '../../contact.interface';
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext"
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { InputMaskModule } from "primeng/inputmask";
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
    InputMaskModule,
    BreadcrumbModule
  ]
})
export class FormComponent {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Contatos', routerLink: '/contacts' }, { label: 'Formulário' }];

  public contact: ContactModel = {
    email: '',
    phone: '',
    name: '',
    avatar: '',
    status: 'enabled'
  };
  public optionStatus = [
    { name: 'Ativo', value: 'enabled' },
    { name: 'Bloqueado', value: 'disabled' },
  ]

  public loading = false;

  constructor(
    private service: ContactService,
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
      { label: 'Contatos', routerLink: '/contacts' },
      { label: id ? 'Editar Contato' : 'Novo Contato' }
    ];
  }

  findById(id: string) {
    this.service.findById(id).subscribe({
      next: (resp: any) => {
        this.contact = resp
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
    const { _id } = this.contact
    console.log(this.contact, 'contact')
    if (this.contact.name.length < 3) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Nome inválido'
      });
      return
    }

    if (!this.contact.phone) {

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Telefone inválido'
      });
      return
    }
    if (_id) {
      this.service.update(this.contact, _id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Contato Atualizado com sucesso!'
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
      this.service.create(this.contact).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Contato criado com sucesso!'
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
    this.router.navigate(['/contacts']);
  }
}
