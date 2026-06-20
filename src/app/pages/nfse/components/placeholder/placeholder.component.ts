import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-nfse-placeholder',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BreadcrumbModule, SidebarComponent],
  template: `
    <app-sidebar />
    <div class="p-4 sm:ml-64 pt-4">
      <p-breadcrumb [model]="breadcrumbItems" [home]="breadcrumbHome" class="mb-4 block" />
      <p-card>
        <div class="flex flex-col items-center justify-center text-center py-10 gap-4">
          <i class="pi pi-cog text-5xl text-gray-400"></i>
          <h2 class="text-xl font-semibold">{{ title }}</h2>
          <p class="text-gray-500 max-w-md">
            Esta tela do módulo NFS-e ainda está em construção. As próximas fases vão entregar:
          </p>
          <ul class="text-left text-gray-500 list-disc">
            <li><strong>Configuração</strong> — município, regime tributário e upload de certificado A1</li>
            <li><strong>Códigos de Serviço</strong> — catálogo de cTribNac/cTribMun com alíquotas</li>
            <li><strong>Emissões</strong> — emitir, listar, consultar e cancelar NFS-e</li>
          </ul>
          <p-button label="Voltar para Dashboard" icon="pi pi-arrow-left" (onClick)="goHome()" />
        </div>
      </p-card>
    </div>
  `
})
export class PlaceholderComponent implements OnInit {
  @Input() title = 'NFS-e';
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'NFS-e' }];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data || {};
    if (data['title']) this.title = data['title'];
    if (data['breadcrumb']) {
      this.breadcrumbItems = [{ label: 'NFS-e' }, { label: data['breadcrumb'] }];
    }
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }
}
