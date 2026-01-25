import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { TicketService } from '../services/ticket.service';
import { AvatarModule } from 'primeng/avatar'
import { TextareaModule } from 'primeng/textarea'
import { DatePipe } from '@angular/common'
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

interface SessionOption {
  label: string;
  value: string;
}

interface ChatMessage {
  id: string;
  body: string;
  from: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  ack?: number;
  mediaData?: any;
}

@Component({
  selector: 'app-chat',
  imports: [
    AvatarModule,
    DatePipe,
    TextareaModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewChecked, OnChanges, OnInit {

  @Input() name: string = '';
  @Input() session: string = '';
  @Input() number: string = '';
  @Input() messages: ChatMessage[] = [];
  @Input() sessions: SessionOption[] = [];

  @Output() onMessageSent = new EventEmitter<any>();
  @Output() onSessionChange = new EventEmitter<string>();

  selectedSession: string = '';

  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  newMessage: string = '';
  loading: boolean = false;
  private shouldScrollToBottom: boolean = false;

  constructor(private service: TicketService) { }

  ngOnInit(): void {
    this.selectedSession = this.session;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && changes['messages'].currentValue) {
      this.shouldScrollToBottom = true;
    }
    if (changes['session'] && changes['session'].currentValue) {
      this.selectedSession = changes['session'].currentValue;
    }
  }

  onSessionChanged(): void {
    if (this.selectedSession && this.selectedSession !== this.session) {
      this.onSessionChange.emit(this.selectedSession);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erro ao fazer scroll:', err);
    }
  }

  loadMessages(): void {
    this.loading = true;
    // Implementar carregamento de mensagens
  }

  sendMessage(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    if (!this.newMessage.trim()) return;

    const messageToSend = this.newMessage.trim();
    this.newMessage = '';
    this.onMessageSent.emit({
      message: messageToSend,
      sessionName: this.session,
      contactNumber: this.number
    });

    // Focar novamente no input após enviar
    setTimeout(() => {
      if (this.messageInput && this.messageInput.nativeElement) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  // Manipular Enter e Shift+Enter
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Ícone de status da mensagem
  getStatusIcon(ack: number): string {
    switch (ack) {
      case 1: return 'pi pi-check'; // Enviado
      case 2: return 'pi pi-check-circle'; // Recebido
      case 3: return 'pi pi-check-circle'; // Lido
      default: return 'pi pi-clock'; // Pendente
    }
  }

  // Classe CSS para o status da mensagem
  getStatusClass(ack: number): string {
    switch (ack) {
      case 1: return 'status-sent';
      case 2: return 'status-delivered';
      case 3: return 'status-read';
      default: return 'status-pending';
    }
  }

  // Verificar se deve mostrar a data
  shouldShowDate(index: number): boolean {
    if (index === 0) return true;

    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];

    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);

    return currentDate.toDateString() !== previousDate.toDateString();
  }

  // Obter texto da data
  getDateText(timestamp: number): string {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return messageDate.toLocaleDateString('pt-BR');
    }
  }

  // Obter avatar inicial
  getAvatarInitial(): string {
    return this.name ? this.name.charAt(0).toUpperCase() : '?';
  }
}
