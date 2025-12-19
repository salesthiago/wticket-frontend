import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { HeaderComponent } from '../../../../layout/header/header.component';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BotConfigService } from '../services/bot-config.service';
import { BotConfig } from 'src/app/components/interface/botConfig';
import { TableModule } from "primeng/table";


@Component({
  selector: 'app-bot-config-list',
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
    ConfirmDialogModule,
    TableModule
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  items: any = [];
  loading = true;
  errorMessage = '';
  dialog: boolean = false;
  botConfig: BotConfig = {
    enabled: true,
    name: '',
    sessionId: null,
    welcomeMessage: 'Olá! Sou o assistente virtual. Como posso ajudar?',
    defaultResponse: 'Entendi sua mensagem. Um atendente humano entrará em contato em breve.',
    businessHours: {
      startTime: '',
      endTime: '',
      enabled: false,
      offHoursMessage: ''
    }
  }
  params = {
    rowsPerPage: 50,
    page: 1,
    search: ''
  }
  connectionStatus = 'disconnected';

  constructor(
    private botConfigService: BotConfigService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.findBotConfig()
  }

  findBotConfig() {
    try {
      this.loading = true
      this.botConfigService.findAll({ ...this.params }).pipe().subscribe({
        next: (resp: any) => {
          this.items = resp?.items || []
          this.loading = false
        }
      })
    } catch (e) {
      this.messageService.add({ text: 'Erro ao Buscar Bots' })
      this.loading = false
    }
  }
  ngOnDestroy(): void {
    //
  }

  editBot(id: string) {
    this.router.navigate(['bot-config/edit/'+ id])
  }

  disableBot(id: string) {
    this.botConfigService.update(id, { enabled: false }).pipe().subscribe({
      next: () => {
        this.findBotConfig()
        this.messageService.add({ severity: 'info', summary: 'Ok', detail: 'Bot Desativado com sucesso' });
      }
    })
  }
  enableBot(id: string) {
    this.botConfigService.update(id, { enabled: false }).pipe().subscribe({
      next: () => {
        this.findBotConfig()
        this.messageService.add({ severity: 'info', summary: 'Ok', detail: 'Bot Ativado com sucesso' });
      }
    })
  }

  destroyBot(event: any, id: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Realmente deseja deletar este Bot ? Esta ação não poderá ser revertida.',
      header: 'Danger Zone',
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
        this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted' });
        this.botConfigService.delete(id).pipe().subscribe({
          next: () => {
            this.findBotConfig()
            this.messageService.add({ severity: 'info', summary: 'Ok', detail: 'Registro deletado com sucesso' });
          },
          error: () => {
            this.messageService.add({ severity: 'danger', summary: 'Ops', detail: 'Este Bot Não pode ser deletado.' });
          }
        })
      },
      reject: () => {
        //
      },
    })
  }

}
