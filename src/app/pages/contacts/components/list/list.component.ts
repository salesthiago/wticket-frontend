import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ContactService } from '../services/contact.service';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    HeaderComponent,
    SidebarComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    DatePipe
]

})
export class ListComponent {
  public items: any = [];
  public loading: boolean = false

  constructor(private service: ContactService, private router: Router) {
  }

  ngOnInit() {
    this.findContacts()
  }
  public add() {
    this.router.navigate(['/contacts/create'])
  }
  public findContacts() {
    this.loading = true;
    this.service.findAll({}).pipe().subscribe({
      next: (resp: any) => {
        this.items = resp
        this.loading = false;
      },
      error: (err: any) => {
        console.log('erro ao listar contatos', err)
        this.loading = false;
      }
    })
  }

  public edit(id: any) {
    this.router.navigate(['/contacts/edit/'+ id]);
  }

  public getSeverity(value: string) {
    if (value === 'enabled') {
      return 'success'
    }
    return 'danger'
  }

  public getValue(value: string) {
    if (value === 'enabled') {
      return 'Ativo'
    }
    return 'Bloqueado'
  }
}
