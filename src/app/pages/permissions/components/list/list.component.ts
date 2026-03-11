import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PermissionService } from '../services/permission.service';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { Router } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    CardModule,
    ButtonModule,
    TableModule,
    SidebarComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    BreadcrumbModule
]

})
export class ListComponent {
  public items: any = [];
  public loading: boolean = false

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Permissões' }];

  constructor(private service: PermissionService, private router: Router) {
  }

  ngOnInit() {
    this.findUsers()
  }
  public add() {
    this.router.navigate(['/users/create'])
  }
  public findUsers() {
    this.loading = true;
    this.service.findAll({}).pipe().subscribe({
      next: (resp: any) => {
        this.items = resp
        this.loading = false;
      },
      error: (err: any) => {
        console.log('erro ao listar usarios', err)
        this.loading = false;
      }
    })
  }

  public edit(id: any) {
    this.router.navigate(['/users/edit/'+ id]);
  }
}
