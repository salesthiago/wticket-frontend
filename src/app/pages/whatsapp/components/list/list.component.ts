import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { WhatsappService } from '../services/whatsapp.service';
import { Socket } from 'socket.io-client';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

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
    HeaderComponent,
    SidebarComponent,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  sessions: Session[] = [];
  loading = true;
  errorMessage = '';
  socket: any;
  connectionStatus = 'disconnected';

  constructor(
    private whatsappService: WhatsappService,
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

      this.socket = io('http://localhost:3000', {
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
}
