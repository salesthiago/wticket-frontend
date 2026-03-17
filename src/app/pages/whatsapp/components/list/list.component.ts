import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { WhatsappService } from '../services/whatsapp.service';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { environment } from '../../../../../environments/enviroment';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ProductsService } from '../../../products/components/services/products.service';
import { AiAgentService } from '../../../ai-agents/services/ai-agent.service';
import { AiAgent } from '../../../ai-agents/ai-agent.interface';
import { SelectModule } from 'primeng/select';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';

interface Session {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'failed';
  qrCode?: string;
  lastActivity?: Date;
  phoneNumber?: string;
  hasClient?: boolean;
}

@Component({
  selector: 'app-session-list',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    MessageModule,
    TooltipModule,
    SidebarComponent,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    ToastModule,
    BreadcrumbModule,
    SelectModule,
    Tabs, TabList, Tab, TabPanels, TabPanel
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  sessions: Session[] = [];
  loading = true;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Whatsapp' }, { label: 'Sessões' }];
  errorMessage = '';
  socket: any;
  connectionStatus = 'disconnected';

  // Modal de edição
  editDialogVisible = false;
  editLoading = false;
  selectedSessionName = '';
  sessionForm = {
    initiationMessage: '',
    initiationKeyword: '',
    finalizationMessage: ''
  };

  // Produtos da sessão
  sessionProducts: any[] = [];
  allProducts: any[] = [];
  selectedProductId: string = '';
  productsLoading = false;

  // Agente IA da sessão
  sessionAiAgentId: string | null = null;
  availableAgents: AiAgent[] = [];
  agentOptions: { label: string; value: string | null }[] = [];
  aiAgentLoading = false;

  constructor(
    private whatsappService: WhatsappService,
    private productsService: ProductsService,
    private aiAgentService: AiAgentService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSessions();
    this.initSocketConnection();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private mapSessions(sessionsData: any[]): Session[] {
    return sessionsData.map(session => {
      // Extrai os campos de diferentes possíveis localizações
      const name = session.name || session.sessionName || session.id || '';
      const status = session.status || session.state || 'disconnected';
      const lastActivity = session.lastActivity ? new Date(session.lastActivity) : undefined;
      const phoneNumber = session.phoneNumber || session.phone || '';
      const qrCode = session.qrCode || session.qr || '';
      const hasClient = session.hasClient || false;

      return {
        id: name, // Usa o nome como ID se não houver ID específico
        name: name,
        status: this.mapStatus(status),
        lastActivity: lastActivity,
        phoneNumber: phoneNumber,
        qrCode: qrCode,
        hasClient: hasClient
      };
    }).filter(session => session.name && session.id);
  }
  async loadSessions(): Promise<void> {
    try {
      this.loading = true;
      this.errorMessage = '';

      this.whatsappService.findAll({}).subscribe({
        next: (response: any) => {
          try {
            // Verifica se a resposta é um objeto com propriedade sessions
            if (response && response.sessions && Array.isArray(response.sessions)) {
              this.sessions = this.mapSessions(response.sessions);
            }
            // Se for diretamente um array
            else if (Array.isArray(response)) {
              this.sessions = this.mapSessions(response);
            }
            // Se for um objeto com outras propriedades
            else if (response && typeof response === 'object') {
              // Tenta extrair sessões do objeto
              const sessionsArray = Object.keys(response).map(key => ({
                ...response[key],
                name: key,
                id: key
              }));
              this.sessions = this.mapSessions(sessionsArray);
            }
            // Se não for nenhum dos formatos esperados
            else {
              console.warn('Formato de resposta inesperado:', response);
              this.sessions = [];
            }
          } catch (error) {
            console.error('Erro ao processar sessões:', error);
            this.sessions = [];
            this.errorMessage = 'Erro ao processar sessões';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar sessões:', error);
          this.errorMessage = 'Erro ao carregar sessões';
          this.sessions = [];
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Erro no loadSessions:', error);
      this.errorMessage = 'Erro ao carregar sessões';
      this.loading = false;
    }
  }
  initSocketConnection(): void {
    import('socket.io-client').then(({ io }) => {
      const token = localStorage.getItem('authToken') || '';

      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        auth: { token }
      });

      this.socket.on('connect', () => {
        this.connectionStatus = 'connected';
        console.log('✅ Conectado ao servidor para lista de sessões');
        this.joinSessionsRoom();
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Erro de conexão:', error);
        this.connectionStatus = 'error';
      });

      this.setupSocketListeners();
    });
  }

  joinSessionsRoom(): void {
    if (this.socket) {
      this.socket.emit('join-sessions-room');
    }
  }

  setupSocketListeners(): void {
    if (!this.socket) return;
    console.log('🔧 Configurando listeners do socket...');
    // Atualização de status de sessão
    this.socket.on('sessionStatusUpdate', (data: any) => {
      console.log('Atualização de status recebida:', data);
      this.updateSessionStatus(data.sessionName, data.status, data.additionalData);
    });

    // Listener para redirecionamento
    this.socket.on('redirect', (data: any) => {
      console.log('🔀 Evento redirect recebido:', data);
      console.log('🔀 Navegando para:', data.route);
      this.router.navigate(['/tickets']);
    });

    // Nova sessão criada
    this.socket.on('sessionCreated', (data: any) => {
      console.log('Nova sessão criada:', data);
      this.addSession({
        id: data.sessionName,
        name: data.sessionName,
        status: 'connecting',
        lastActivity: new Date()
      });
    });

    this.socket.on('sessionDeleted', (data: any) => {
      console.log('Sessão removida:', data);
      this.removeSession(data.sessionName);
    });

    this.socket.on('qrCodeUpdate', (data: any) => {
      console.log('QR Code atualizado:', data);
      this.updateSessionQrCode(data.sessionName, data.qrCode);
    });

    this.socket.on('error', (data: any) => {
      this.errorMessage = data;
      this.loading = false;
      console.error('Error:', data);
    });

    // Todas as sessões (atualização completa)
    this.socket.on('allSessions', (data: any) => {
      console.log('Recebendo todas as sessões:', data);

      if (data && data.sessions && Array.isArray(data.sessions)) {
        this.sessions = this.mapSessions(data.sessions);
      } else if (Array.isArray(data)) {
        this.sessions = this.mapSessions(data);
      } else if (data && typeof data === 'object') {
        const sessionsArray = Object.keys(data).map(key => ({
          ...data[key],
          name: key,
          id: key
        }));
        this.sessions = this.mapSessions(sessionsArray);
      }

      this.loading = false;
    });
  }

  private mapStatus(status: string): Session['status'] {
    if (!status) return 'disconnected';

    const statusMap: { [key: string]: Session['status'] } = {
      'connected': 'connected',
      'disconnected': 'disconnected',
      'connecting': 'connecting',
      'initializing': 'connecting',
      'authenticated': 'connected',
      'qr': 'connecting',
      'failed': 'failed',
      'inChat': 'connected',
      'CONFLICT': 'failed',
      'UNLAUNCHED': 'disconnected',
      'notConnected': 'disconnected'
    };

    const lowerStatus = status.toLowerCase();
    return statusMap[status] || statusMap[lowerStatus] || 'disconnected';
  }

  private addSession(session: Session): void {
    const existingIndex = this.sessions.findIndex(s => s.name === session.name);
    if (existingIndex === -1) {
      this.sessions.push(session);
    } else {
      this.sessions[existingIndex] = { ...this.sessions[existingIndex], ...session };
    }
  }

  private removeSession(sessionName: string): void {
    this.sessions = this.sessions.filter(session => session.name !== sessionName);
  }

  private updateSessionStatus(sessionName: string, status: string, additionalData?: any): void {
    const session = this.sessions.find(s => s.name === sessionName);
    if (session) {
      session.status = this.mapStatus(status);
      session.lastActivity = new Date();

      if (additionalData?.phoneNumber) {
        session.phoneNumber = additionalData.phoneNumber;
      }

      if (status === 'connected') {
        session.qrCode = undefined;
      }
    }
  }

  private updateSessionQrCode(sessionName: string, qrCode: string): void {
    const session = this.sessions.find(s => s.name === sessionName);
    if (session) {
      session.qrCode = qrCode;
      session.status = 'connecting';
      session.lastActivity = new Date();
    }
  }

  getStatusIcon(status: Session['status']): string {
    const icons = {
      'connected': 'pi pi-check-circle',
      'disconnected': 'pi pi-times-circle',
      'connecting': 'pi pi-spinner pi-spin',
      'failed': 'pi pi-exclamation-triangle'
    };
    return icons[status];
  }

  getStatusColor(status: Session['status']): string {
    const colors = {
      'connected': 'success',
      'disconnected': 'secondary',
      'connecting': 'warning',
      'failed': 'danger'
    };
    return colors[status];
  }

  getStatusText(status: Session['status']): string {
    const texts = {
      'connected': 'Conectado',
      'disconnected': 'Desconectado',
      'connecting': 'Conectando...',
      'failed': 'Falha na conexão'
    };
    return texts[status];
  }

  disconnectSession(sessionName: string): void {
    if (this.socket) {
      this.socket.emit('disconnectSession', { sessionName });
    }
  }

  reconnectSession(sessionName: string): void {
    if (this.socket) {
      this.socket.emit('reconnectSession', { sessionName });
      this.updateSessionStatus(sessionName, 'connecting');
    }
  }

  deleteSession(event: any, sessionName: string): void {

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Realmente deseja deletar esta sessão ?',
      header: 'Deletar Sessão',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Deletar',
        severity: 'danger',
      },

      accept: () => {
        this.whatsappService.delete(sessionName).pipe().subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Sessão Deletada' });
            this.loadSessions()
          }
        })
      },
      reject: () => {
        //this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  refreshSessions(): void {
    this.loading = true;
    if (this.socket) {
      this.socket.emit('getAllSessions');
    } else {
      this.loadSessions();
    }
  }

  openEditDialog(sessionName: string): void {
    this.selectedSessionName = sessionName;
    this.editLoading = true;
    this.editDialogVisible = true;
    this.sessionProducts = [];
    this.selectedProductId = '';
    this.sessionAiAgentId = null;

    this.whatsappService.getSession(sessionName).subscribe({
      next: (session: any) => {
        this.sessionForm = {
          initiationMessage: session.initiationMessage || '',
          initiationKeyword: session.initiationKeyword || 'PROSSEGUIR',
          finalizationMessage: session.finalizationMessage || ''
        };
        // Carrega agente IA vinculado (pode ser objeto populado ou só o ID)
        this.sessionAiAgentId = session.aiAgentId?._id || session.aiAgentId || null;
        this.editLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar sessão:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados da sessão'
        });
        this.editLoading = false;
        this.editDialogVisible = false;
      }
    });

    this.loadSessionProducts(sessionName);
    this.loadAllProducts();
    this.loadAvailableAgents();
  }

  loadSessionProducts(sessionName: string): void {
    this.productsLoading = true;
    this.whatsappService.getSessionProducts(sessionName).subscribe({
      next: (products: any) => {
        this.sessionProducts = Array.isArray(products) ? products : (products?.products || []);
        this.productsLoading = false;
      },
      error: () => {
        this.sessionProducts = [];
        this.productsLoading = false;
      }
    });
  }

  loadAllProducts(): void {
    this.productsService.findAll({ isActive: true }).subscribe({
      next: (resp: any) => {
        const list = Array.isArray(resp) ? resp : (resp?.products || resp?.data || []);
        this.allProducts = list;
      },
      error: () => { this.allProducts = []; }
    });
  }

  get availableProducts(): any[] {
    const linkedIds = this.sessionProducts.map((p: any) => p._id || p.id);
    return this.allProducts.filter((p: any) => !linkedIds.includes(p._id || p.id));
  }

  addProductToSession(): void {
    if (!this.selectedProductId || !this.selectedSessionName) return;
    this.productsLoading = true;
    this.whatsappService.addSessionProduct(this.selectedSessionName, this.selectedProductId).subscribe({
      next: () => {
        this.selectedProductId = '';
        this.loadSessionProducts(this.selectedSessionName);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao vincular produto' });
        this.productsLoading = false;
      }
    });
  }

  removeProductFromSession(productId: string): void {
    this.productsLoading = true;
    this.whatsappService.removeSessionProduct(this.selectedSessionName, productId).subscribe({
      next: () => {
        this.loadSessionProducts(this.selectedSessionName);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao remover produto' });
        this.productsLoading = false;
      }
    });
  }

  loadAvailableAgents(): void {
    this.aiAgentLoading = true;
    this.aiAgentService.list(undefined, 'ativo').subscribe({
      next: (agents) => {
        this.availableAgents = agents.filter(a => a.tipo === 'atendimento' || a.tipo === 'vendas');
        this.agentOptions = [
          { label: '— Nenhum agente IA —', value: null },
          ...this.availableAgents.map(a => ({
            label: `${a.nome} (${a.tipo})`,
            value: a._id!
          }))
        ];
        this.aiAgentLoading = false;
      },
      error: () => {
        this.agentOptions = [{ label: '— Nenhum agente IA —', value: null }];
        this.aiAgentLoading = false;
      }
    });
  }

  saveAiAgent(): void {
    if (!this.selectedSessionName) return;
    this.aiAgentLoading = true;

    this.whatsappService.linkAiAgent(this.selectedSessionName, this.sessionAiAgentId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.sessionAiAgentId
            ? 'Agente IA vinculado com sucesso'
            : 'Agente IA desvinculado'
        });
        this.aiAgentLoading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao vincular agente IA' });
        this.aiAgentLoading = false;
      }
    });
  }

  closeEditDialog(): void {
    this.editDialogVisible = false;
    this.selectedSessionName = '';
    this.sessionForm = {
      initiationMessage: '',
      initiationKeyword: '',
      finalizationMessage: ''
    };
    this.sessionProducts = [];
    this.allProducts = [];
    this.selectedProductId = '';
    this.sessionAiAgentId = null;
    this.availableAgents = [];
  }

  saveSession(): void {
    if (!this.selectedSessionName) return;

    this.editLoading = true;

    this.whatsappService.updateSession(this.selectedSessionName, this.sessionForm).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Sessão atualizada com sucesso'
        });
        this.editLoading = false;
        this.closeEditDialog();
      },
      error: (error) => {
        console.error('Erro ao atualizar sessão:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.error || 'Erro ao atualizar sessão'
        });
        this.editLoading = false;
      }
    });
  }
}
