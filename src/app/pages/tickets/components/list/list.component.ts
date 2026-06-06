import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { WhatsappService } from '../../../whatsapp/components/services/whatsapp.service';
import { TicketService } from '../services/ticket.service';
import { ProductsService } from '../../../products/components/services/products.service';
import { ChatComponent } from '../chat/chat.component';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { environment } from '../../../../../environments/enviroment';

interface SaleItem {
  product?: any;
  productName?: string;
  quantity: number;
  unitPrice: number;
  sold: boolean;
  notes?: string;
}

interface Ticket {
  _id: string;
  contactNumber: string;
  contactName: string;
  sessionName: string;
  subject: string;
  status: 'opened' | 'in_progress' | 'finished' | 'canceled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'support' | 'sale';
  origin?: 'manual' | 'bot' | 'gpt' | 'gemini' | 'claude' | 'whatsapp';
  saleItems?: SaleItem[];
  assignedTo?: any;
  tags: string[];
  lastMessage?: Date;
  messages?: any | null;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-tickets',
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    MessageModule,
    TooltipModule,
    ChatComponent,
    ConfirmDialogModule,
    ToastModule,
    BreadcrumbModule,
    SidebarComponent,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    ToggleSwitchModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class TicketsComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  loading = true;
  errorMessage = '';
  syncLoading = false;
  syncMessage = '';

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Tickets' }];

  // Filtros
  categoryFilter: string = 'support';
  statusFilter: string = '';
  priorityFilter: string = '';
  sessionFilter: string = '';
  searchText: string = '';
  dialogStatus: boolean = false;
  dialogPriority: boolean = false;
  socket: any;

  // Dialog
  displayDialog = false;
  selectedTicket: Ticket | null = null;

  // Sale items
  sessionProductOptions: any[] = [];
  saleItemsLoading = false;

  // Opções para filtros
  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Aberto', value: 'opened' },
    { label: 'Em Andamento', value: 'in_progress' },
    { label: 'Finalizado', value: 'finished' },
    { label: 'Cancelado', value: 'canceled' }
  ];

  priorityOptions = [
    { label: 'Todos', value: '' },
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
  ];

  sessions: any[] = [];

  // Criação manual de ticket
  newTicketDialog = false;
  creatingTicket = false;
  newTicket: any = this.emptyNewTicket();

  // Opções de origem (somente as que fazem sentido criar manualmente)
  originOptions = [
    { label: 'Manual', value: 'manual' },
    { label: 'Bot', value: 'bot' },
    { label: 'GPT', value: 'gpt' },
    { label: 'Gemini', value: 'gemini' },
    { label: 'Claude', value: 'claude' }
  ];

  constructor(
    private whatsappService: WhatsappService,
    private ticketService: TicketService,
    private productsService: ProductsService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }


  async ngOnInit() {
    await this.loadSessions();
    this.loadTickets();
    this.initSocketConnection();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  async loadSessions() {
    try {
      this.sessions = [
        { label: 'Todas as sessões', value: '' }
      ];
      this.whatsappService.findAll({}).pipe().subscribe({
        next: (resp: any) => {
          resp.map((s: any) => {
            this.sessions.push({ label: s.name, value: s.name })
          })
        }
      });
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }

  async loadTickets() {
    try {
      this.loading = true;
      const params: any = {};
      if (this.categoryFilter) params['category'] = this.categoryFilter;
      this.ticketService.getTickets(params).pipe().subscribe({
        next: (resp: Ticket[]) => {
          this.tickets = resp;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar tickets:', error);
          this.errorMessage = 'Erro ao carregar tickets';
          this.loading = false;
        }
      });
    } catch (error) {
      this.tickets = [];
      console.error('Erro ao carregar tickets:', error);
      this.errorMessage = 'Erro ao carregar tickets';
      this.loading = false;
    }
  }

  async syncContacts() {
    try {
      this.syncLoading = true;
      this.syncMessage = 'Sincronizando contatos...';
      console.log('sessionFilter', this.sessionFilter)
      if (!this.sessionFilter) {
        throw ({ message: 'Erro na sincronização, selecione uma sessão antes' })
      }
      this.whatsappService.syncContacts(this.sessionFilter).pipe().subscribe({
        next: (resp: any) => {
          console.log('resp syncContacts >>>', resp)
          this.syncMessage = 'Sincronização concluída com sucesso!';
        }
      });

      setTimeout(() => {
        this.syncMessage = '';
        this.loadTickets();
      }, 2000);
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      this.syncMessage = error?.message || 'Erro na sincronização';
    } finally {
      this.syncLoading = false;
    }
  }

  public changeStatus() {
    this.dialogStatus = true
  }
  public changeTicket() {
    this.dialogPriority = true
  }
  public updateStatusTicket() {
    if ((this.selectedTicket?._id !== null) && (this.selectedTicket?.status !== null)) {
      this.ticketService.updateStatus(this.selectedTicket?._id ?? '', this.selectedTicket?.status ?? '').pipe().subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Status Atualizado ' })
        },
        error: (err) => {
          console.log(err, '<<<< erro ao atualizar status')
          this.messageService.add({ severity: 'error', summary: 'Erro ao atualizar status.' })
        }
      })
    }
  }
  public updateTicket() {
    if ((this.selectedTicket?._id !== null) && (this.selectedTicket?.status !== null)) {
      this.ticketService.update(this.selectedTicket?._id ?? '', { priority: this.selectedTicket?.priority ?? 'medium' }).pipe().subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Prioridade Atualizada! ' })
        },
        error: (err: any) => {
          console.log(err, '<<<< erro ao atualizar status')
          this.messageService.add({ severity: 'error', summary: 'Erro ao atualizar status.' })
        }
      })
    }
  }

  getSelectedStatus(): any {
    return this.statusOptions.find(opt => opt.value === this.selectedTicket?.status);
  }
  onStatusChange(event: any): void {
     if (this.selectedTicket && event && event.value) {
      this.selectedTicket.status = event.value;
    }
  }
  getStatusSeverity(status: string) {
    switch (status) {
      case 'opened': return 'warning';
      case 'in_progress': return 'info';
      case 'finished': return 'success';
      case 'canceled': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string) {
    switch (status) {
      case 'opened': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizado';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  }

  getPrioritySeverity(priority: string) {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'secondary';
    }
  }

  getPriorityLabel(priority: string) {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  }

  openTicket(ticket: Ticket) {
    console.log('Opening ticket:', ticket);

    if (!ticket.contactNumber) {
      console.error('Erro: contactNumber está undefined ou vazio', ticket);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Número de contato não encontrado para este ticket'
      });
      return;
    }

    if (!ticket.sessionName) {
      console.error('Erro: sessionName está undefined ou vazio', ticket);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Sessão não encontrada para este ticket'
      });
      return;
    }

    this.selectedTicket = { ...ticket, saleItems: ticket.saleItems ? [...ticket.saleItems] : [] };
    this.displayDialog = true;
    this.socket.emit('rescueMessages', {
      sessionName: ticket.sessionName,
      contactNumber: ticket.contactNumber
    });

    if (ticket.category === 'sale') {
      this.loadSessionProductOptions(ticket.sessionName);
    }
  }

  loadSessionProductOptions(sessionName: string): void {
    this.whatsappService.getSessionProducts(sessionName).subscribe({
      next: (products: any) => {
        this.sessionProductOptions = Array.isArray(products) ? products : (products?.products || []);
      },
      error: () => { this.sessionProductOptions = []; }
    });
  }

  addSaleItem(): void {
    if (!this.selectedTicket) return;
    if (!this.selectedTicket.saleItems) this.selectedTicket.saleItems = [];
    this.selectedTicket.saleItems.push({ quantity: 1, unitPrice: 0, sold: false });
  }

  removeSaleItem(index: number): void {
    if (!this.selectedTicket?.saleItems) return;
    this.selectedTicket.saleItems.splice(index, 1);
  }

  onSaleItemProductChange(item: SaleItem): void {
    if (item.product) {
      const found = this.sessionProductOptions.find((p: any) => p._id === item.product);
      if (found) {
        item.productName = found.name;
        item.unitPrice = found.price || 0;
      }
    }
  }

  saveSaleItems(): void {
    if (!this.selectedTicket) return;
    this.saleItemsLoading = true;
    this.ticketService.updateSaleItems(this.selectedTicket._id, {
      saleItems: this.selectedTicket.saleItems
    }).subscribe({
      next: (resp: any) => {
        this.saleItemsLoading = false;
        if (this.selectedTicket) {
          this.selectedTicket.saleItems = resp.saleItems || this.selectedTicket.saleItems;
        }
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Itens de venda salvos!' });
        this.loadTickets();
      },
      error: () => {
        this.saleItemsLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar itens de venda' });
      }
    });
  }

  get saleTotal(): number {
    if (!this.selectedTicket?.saleItems) return 0;
    return this.selectedTicket.saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  closeDialog() {
    this.displayDialog = false;
    this.selectedTicket = null;
    this.sessionProductOptions = [];
  }

  onCategoryChange(category: string): void {
    this.categoryFilter = category;
    this.loadTickets();
  }

  private emptyNewTicket() {
    return {
      contactNumber: '',
      contactName: '',
      sessionName: this.sessionFilter || '',
      subject: '',
      priority: 'medium',
      category: this.categoryFilter || 'support',
      origin: 'manual'
    };
  }

  openNewTicketDialog(): void {
    this.newTicket = this.emptyNewTicket();
    this.newTicketDialog = true;
  }

  createTicket(): void {
    if (!this.newTicket.contactNumber || !this.newTicket.sessionName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Informe o número do contato e a sessão.'
      });
      return;
    }

    this.creatingTicket = true;
    this.ticketService.create(this.newTicket).subscribe({
      next: () => {
        this.creatingTicket = false;
        this.newTicketDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Ticket criado!' });
        this.loadTickets();
      },
      error: (err) => {
        this.creatingTicket = false;
        console.error('Erro ao criar ticket:', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar ticket.' });
      }
    });
  }

  getOriginLabel(origin?: string) {
    switch (origin) {
      case 'manual': return 'Manual';
      case 'bot': return 'Bot';
      case 'gpt': return 'GPT';
      case 'gemini': return 'Gemini';
      case 'claude': return 'Claude';
      case 'whatsapp': return 'WhatsApp';
      default: return '—';
    }
  }

  getOriginSeverity(origin?: string) {
    switch (origin) {
      case 'manual': return 'success';
      case 'bot': return 'warning';
      case 'gpt':
      case 'gemini':
      case 'claude': return 'info';
      case 'whatsapp': return 'secondary';
      default: return 'secondary';
    }
  }

  get filteredTickets() {
    return this.tickets.filter(ticket => {
      const matchesStatus = !this.statusFilter || ticket.status === this.statusFilter;
      const matchesPriority = !this.priorityFilter || ticket.priority === this.priorityFilter;
      const matchesSession = !this.sessionFilter || ticket.sessionName === this.sessionFilter;
      const matchesSearch = !this.searchText ||
        ticket.contactNumber.includes(this.searchText) ||
        (ticket.contactName && ticket.contactName.toLowerCase().includes(this.searchText.toLowerCase())) ||
        ticket.subject.toLowerCase().includes(this.searchText.toLowerCase());

      return matchesStatus && matchesPriority && matchesSession && matchesSearch;
    });
  }

  get totalTickets() {
    return this.filteredTickets.length;
  }

  get openedTickets() {
    return this.filteredTickets.filter(t => t.status === 'opened').length;
  }

  get inProgressTickets() {
    return this.filteredTickets.filter(t => t.status === 'in_progress').length;
  }

  get finishedTickets() {
    return this.filteredTickets.filter(t => t.status === 'finished').length;
  }

  get canceledTickets() {
    return this.filteredTickets.filter(t => t.status === 'canceled').length;
  }

  onBack() {
    this.router.navigate(['/dashboard']);
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
        console.log('✅ Conectado ao servidor Socket.io');
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Erro de conexão Socket.io:', error.message);

        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 2000);
      });

      this.socket.on('disconnect', (reason: string) => {
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

    this.socket.on('statusUpdate', (data: any) => {
      console.log('Status atualizado:', data.status);
    });

    this.socket.on('stateChange', (data: any) => {
      console.log('Estado alterado:', data.state);
    });

    this.socket.on('loadingUpdate', (data: any) => {
      console.log('Carregamento:', data.percent, '% -', data.message);
    });

    this.socket.on('success', (data: any) => {
      console.log('Sucesso:', data.message);
    });

    this.socket.on('error', (data: any) => {
      this.errorMessage = data;
      this.loading = false;
      console.error('Error:', data);
    });

    this.socket.on('newMessage', (data: any) => {
      console.log('Nova mensagem:', data.message);
    });

    this.socket.on('onMessage', (data: any) => {
      console.log('nova msg:', data.message);
      this.loadTickets()
    });
    this.socket.on('sessionReconnectError', (data: any) => {
      console.log('sessionReconnectError:', data);
      const { session, error } = data
      this.messageService.add({
        severity: 'error',
        summary: session + ' - ' + error
      })
    });

    this.socket.on('recoveryMessages', (data: any) => {
      console.log('recoveryMessages', data);
      if (this.selectedTicket && data) {
        // Converter objeto para array se necessário
        let messagesArray;

        if (Array.isArray(data)) {
          // Já é um array
          messagesArray = data;
        } else if (typeof data === 'object' && data !== null) {
          // É um objeto, converter para array
          messagesArray = Object.values(data);
        } else {
          // Formato inesperado
          console.error('Formato inesperado de dados em recoveryMessages:', data);
          messagesArray = [];
        }

        console.log('Mensagens convertidas:', messagesArray);

        this.selectedTicket.messages = messagesArray;
      }
    });
  }

  public destroyTicket(id: string, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Realmente deseja deletar este ticket ?',
      header: 'Atenção !!',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
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
        this.ticketService.destroy(id).pipe().subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Ticket Deletado' });
            this.loadTickets()
          }
        })
      },
      reject: () => {
        //
      },
    });
  }

  public sendMessage(event: any) {
    console.log('sendingMessage', event)
    this.socket.emit('sendMessage', event)
  }

  // Getter para sessões disponíveis para o chat (sem a opção "Todas")
  get chatSessions() {
    return this.sessions.filter(s => s.value !== '');
  }

  // Handler para mudança de sessão no chat
  onChatSessionChange(newSession: string) {
    if (this.selectedTicket && newSession) {
      console.log('Alterando sessão de', this.selectedTicket.sessionName, 'para', newSession);
      this.selectedTicket.sessionName = newSession;

      // Recarregar mensagens com a nova sessão
      this.socket.emit('rescueMessages', {
        sessionName: newSession,
        contactNumber: this.selectedTicket.contactNumber
      });
    }
  }
}
