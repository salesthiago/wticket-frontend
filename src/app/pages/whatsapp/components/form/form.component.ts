import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { WhatsappService } from '../services/whatsapp.service';
import { MessageModule } from 'primeng/message'
import { InputMaskModule } from 'primeng/inputmask'
import { InputTextModule } from 'primeng/inputtext'
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/enviroment';


@Component({
  selector: 'app-session-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    InputMaskModule,
    InputTextModule,
  ],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, OnDestroy {
  sessionForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  qrCodeData: string | null = null;
  currentSession: string | null = null;
  socket: any;
  connectionStatus = 'disconnected';
  loadingProgress = 0;
  loadingMessage = '';

  constructor(
    private fb: FormBuilder,
    private whatsappService: WhatsappService,
    private router: Router
  ) {
    this.sessionForm = this.fb.group({
      sessionName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      initiationMessage: ['👋 Olá! Bem-vindo(a) ao nosso atendimento automático.\n\nPara continuar, por favor digite: PROSSEGUIR'],
      initiationKeyword: ['PROSSEGUIR', [Validators.required]],
      finalizationMessage: ['✅ Atendimento finalizado.\n\nObrigado pelo contato! Para iniciar um novo atendimento, envie outra mensagem.']
    });
  }

  ngOnInit(): void {
    this.initSocketConnection();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  isInvalid(controlName: string) {
    const control = this.sessionForm.get(controlName);
    return control?.invalid && (control.touched || this.sessionForm);
  }

  initSocketConnection(): void {
    console.log('Iniciando conexão Socket.io...');

    import('socket.io-client').then(({ io }) => {
      console.log('Socket.io client carregado');

      const token = localStorage.getItem('authToken') || '';

      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: token
        }
      });

      this.socket.on('connect', () => {
        this.connectionStatus = 'connected';
        console.log('✅ Conectado ao servidor Socket.io');
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Erro de conexão Socket.io:', error.message);
        this.connectionStatus = 'error';
        this.errorMessage = 'Falha na conexão em tempo real';

        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 2000);
      });

      this.socket.on('disconnect', (reason: string) => {
        this.connectionStatus = 'disconnected';
        console.log('📴 Desconectado do servidor Socket.io:', reason);
      });

      this.setupSocketListeners();
    }).catch(error => {
      console.error('❌ Erro ao carregar socket.io-client:', error);
    });
  }

  setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('redirect', (data: any) => {
      console.log('🔀 Redirecionando para:', data.route);
      this.router.navigate([data.route]);
    });
    this.socket.on('qrCodeUpdate', (data: any) => {
      console.log('🔥 Evento qrCodeUpdate recebido!', data);
      this.qrCodeData = data.qrCode; // Adiciona prefixo para imagem
      this.loading = false;
    });

    this.socket.on('statusUpdate', (data: any) => {
      console.log('Status atualizado:', data.status);
    });

    this.socket.on('stateChange', (data: any) => {
      console.log('Estado alterado:', data.state);
    });

    this.socket.on('loadingUpdate', (data: any) => {
      this.loadingProgress = data.percent;
      this.loadingMessage = data.message;
      console.log('Carregamento:', data.percent, '% -', data.message);
    });

    this.socket.on('success', (data: any) => {
      this.successMessage = data.message;
      this.loading = false;
      this.qrCodeData = null;
      console.log('Sucesso:', data.message);
      this.router.navigate(['/tickets'])
    });

    this.socket.on('error', (data: any) => {
      this.errorMessage = data.error;
      this.loading = false;
      console.error('Erro:', data.error);
    });

    this.socket.on('newMessage', (data: any) => {
      console.log('Nova mensagem:', data.message);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.sessionForm.valid) {
      await this.createSession();
    }
  }

  async createSession(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.qrCodeData = null;

    try {
      const sessionName = this.sessionForm.get('sessionName')?.value;
      const initiationMessage = this.sessionForm.get('initiationMessage')?.value;
      const initiationKeyword = this.sessionForm.get('initiationKeyword')?.value;
      const finalizationMessage = this.sessionForm.get('finalizationMessage')?.value;

      this.currentSession = sessionName;

      if (this.socket) {
        this.socket.emit('join-session', sessionName);
        console.log('Entrou na sala:', sessionName);
      }

      this.whatsappService.create({
        name: sessionName,
        initiationMessage,
        initiationKeyword,
        finalizationMessage
      }).subscribe({
        next: (response) => {
          this.successMessage = 'Sessão criada com sucesso! Aguardando QR Code...';
          console.log('Sessão criada:', response);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erro ao criar sessão';
          this.loading = false;
          console.error('Erro na criação:', error);
        }
      });

    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Erro ao criar sessão';
      this.loading = false;
      console.error('Erro catch:', error);
    }
  }

  onCancel(): void {
    if (this.currentSession && this.socket) {
      this.socket.emit('leave-session', this.currentSession);
    }
    this.currentSession = null;
    this.qrCodeData = null;
    this.loading = false;
    this.router.navigate(['/whatsapp'])
  }
}
