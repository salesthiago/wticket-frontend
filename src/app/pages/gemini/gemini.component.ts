import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-gemini-config',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    CardModule,
    SidebarComponent,
    SelectModule,
    ToastModule,
    BreadcrumbModule
  ],
  providers: [MessageService],
  templateUrl: './gemini.component.html',
  styleUrls: ['./gemini.component.scss']
})
export class GeminiConfigComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Whatsapp' }, { label: 'Gemini' }];
  loading = false;
  isSaving = false;
  isDeleting = false;
  settingsExists = false;

  statusOptions = [
    { label: 'Ativo', value: 'enabled' },
    { label: 'Desativado', value: 'disabled' }
  ];

  geminiConfig = {
    agentName: '',
    token: '',
    prompt: '',
    status: 'enabled'
  };

  // Para testes
  testMessage = '';
  testResponse = '';
  isTesting = false;

  constructor(
    private geminiService: GeminiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.geminiService.getSettings().subscribe({
      next: (resp: any) => {
        console.log('Settings carregadas:', resp);
        if (resp._id) {
          this.settingsExists = true;
          this.geminiConfig = {
            agentName: resp.value?.agentName || '',
            token: resp.value?.token || '',
            prompt: resp.value?.prompt || '',
            status: resp.status || 'enabled'
          };
        } else {
          this.settingsExists = false;
          this.geminiConfig = {
            agentName: '',
            token: '',
            prompt: '',
            status: 'enabled'
          };
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar configurações:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar configurações do Gemini'
        });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.geminiConfig.agentName || !this.geminiConfig.token || !this.geminiConfig.prompt) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios'
      });
      return;
    }

    this.isSaving = true;

    const operation = this.settingsExists
      ? this.geminiService.updateSettings(this.geminiConfig)
      : this.geminiService.saveSettings(this.geminiConfig);

    operation.subscribe({
      next: (resp: any) => {
        console.log('Resposta do save/update:', resp);
        this.settingsExists = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: resp.message || 'Configurações salvas com sucesso!'
        });
        this.isSaving = false;
        this.loadSettings();
      },
      error: (err: any) => {
        console.error('Erro ao salvar:', err);
        const message = err?.error?.message || 'Erro ao salvar configurações';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: message
        });
        this.isSaving = false;
      }
    });
  }

  onDelete(): void {
    if (!this.settingsExists) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não há configuração para deletar'
      });
      return;
    }

    if (!confirm('Tem certeza que deseja deletar a configuração do Gemini?')) {
      return;
    }

    this.isDeleting = true;
    this.geminiService.deleteSettings().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Configuração deletada com sucesso!'
        });
        this.settingsExists = false;
        this.geminiConfig = {
          agentName: '',
          token: '',
          prompt: '',
          status: 'enabled'
        };
        this.isDeleting = false;
      },
      error: (err: any) => {
        console.error('Erro ao deletar:', err);
        const message = err?.error?.message || 'Erro ao deletar configuração';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: message
        });
        this.isDeleting = false;
      }
    });
  }

  onTestMessage(): void {
    if (!this.testMessage) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite uma mensagem para testar'
      });
      return;
    }

    this.isTesting = true;
    this.testResponse = '';

    this.geminiService.sendMessage(this.testMessage).subscribe({
      next: (resp: any) => {
        console.log('Resposta do teste:', resp);
        this.testResponse = resp.text || 'Sem resposta';
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Mensagem enviada com sucesso!'
        });
        this.isTesting = false;
      },
      error: (err: any) => {
        console.error('Erro ao testar:', err);
        const message = err?.error?.message || 'Erro ao enviar mensagem';
        this.testResponse = 'Erro: ' + message;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: message
        });
        this.isTesting = false;
      }
    });
  }
}
