import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { LeadsService } from '../services/leads.service';
import { environment } from '../../../../../environments/enviroment';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-lead-integration',
  standalone: true,
  templateUrl: './integration.component.html',
  providers: [ConfirmationService, MessageService],
  imports: [
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    TagModule,
    DialogModule,
    ConfirmDialog,
    Toast,
    DatePipe,
    FormsModule,
    SidebarComponent,
    BreadcrumbModule
  ]
})
export class LeadIntegrationComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Leads', routerLink: '/leads' }, { label: 'Integração API' }];

  public keys: any[] = [];
  public loading = false;
  public newKeyName = '';
  public createdKey: string | null = null;
  public showCreatedDialog = false;

  public readonly endpoint = environment.apiUrl + '/integrations/leads';

  public get curlJson(): string {
    return `curl -X POST ${this.endpoint} \\
  -H "x-api-key: SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maria Souza",
    "phone": "11999998888",
    "email": "maria@exemplo.com",
    "description": "Carro fazendo barulho ao frear",
    "externalId": "form-site-123"
  }'`;
  }

  public get curlMultipart(): string {
    return `curl -X POST ${this.endpoint} \\
  -H "x-api-key: SUA_CHAVE" \\
  -F "name=Maria Souza" \\
  -F "phone=11999998888" \\
  -F "description=Carro fazendo barulho ao frear" \\
  -F "photos=@foto1.jpg" \\
  -F "photos=@foto2.jpg"`;
  }

  constructor(
    private service: LeadsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadKeys();
  }

  public loadKeys() {
    this.loading = true;
    this.service.findApiKeys().subscribe({
      next: (keys) => {
        this.keys = keys;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Erro ao carregar chaves' });
      }
    });
  }

  public createKey() {
    const name = this.newKeyName.trim();
    if (!name) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Dê um nome para a chave (ex.: Site, Landing page)' });
      return;
    }
    this.service.createApiKey(name).subscribe({
      next: (resp) => {
        this.createdKey = resp.key;
        this.showCreatedDialog = true;
        this.newKeyName = '';
        this.loadKeys();
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Erro ao criar chave' });
      }
    });
  }

  public copy(text: string | null) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Copiado para a área de transferência' }),
      () => this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Não foi possível copiar; selecione e copie manualmente.' })
    );
  }

  public closeCreatedDialog() {
    this.showCreatedDialog = false;
    this.createdKey = null;
  }

  public confirmRevoke(key: any) {
    this.confirmationService.confirm({
      message: `Revogar a chave "${key.name}"? Integrações que usam essa chave vão parar de funcionar imediatamente.`,
      header: 'Revogar Chave',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Não', severity: 'secondary', variant: 'text' },
      acceptButtonProps: { severity: 'danger', label: 'Revogar' },
      accept: () => {
        this.service.revokeApiKey(key._id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Chave revogada' });
            this.loadKeys();
          },
          error: (error: any) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message || 'Erro ao revogar chave' });
          }
        });
      }
    });
  }
}
