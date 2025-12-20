import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { BotConfigService } from '../services/bot-config.service';
import { MessageModule } from 'primeng/message'

import { ButtonModule  } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { HeaderComponent } from 'src/app/layout/header/header.component';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { BotConfig } from 'src/app/components/interface/botConfig';
import { AutoResponse } from 'src/app/components/interface/autoResponse';
import { WhatsappService } from 'src/app/pages/whatsapp/components/services/whatsapp.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToggleSwitch } from "primeng/toggleswitch";
import { InputMaskModule } from "primeng/inputmask";
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from "primeng/table";
import { Dialog } from "primeng/dialog";

@Component({
  selector: 'app-bot-settings-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    HeaderComponent,
    SidebarComponent,
    SelectModule,
    ToggleSwitch,
    InputMaskModule,
    TableModule,
    Dialog,
    SlicePipe
],
providers: [MessageService],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class BotConfigFormComponent implements OnInit, OnDestroy {

  loading = false;
  errorMessage = '';
  successMessage = '';
  statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Desativado', value: false }
  ];
  triggerTypeOptions = [
    { label: 'Palavra-chave', value: 'keyword' },
    { label: 'Correspondência Exata', value: 'exact_match' },
    { label: 'Expressão Regular', value: 'regex' }
  ];
  actionOptions = [
    { label: 'Próximo Passo', value: 'nextStep' },
    { label: 'Chamar Outro Bot', value: 'callBot' },
    { label: 'Finalizar', value: 'finish' }
  ];
  sessions: any = [];
  availableBots: any[] = [];
  loadingProgress = 0;
  loadingMessage = '';
  autoResponse: AutoResponse = {
    botConfig: '',
    triggerType: 'regex',
    trigger: '',
    enabled: true,
    question: '',
    action: null,
    priority: 0,
    options: []
  }
  autoResponses: AutoResponse[] = []
  dialogResponses: boolean = false
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

  constructor(
    private router: Router,
    private botConfigService: BotConfigService,
    private whatsappService: WhatsappService,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    this.loadSessions()
    const id = this.route.snapshot.paramMap.get('id')
    if (id) {
      this.findById(id)
    }
  }

  findById(id: string): void {
    this.botConfigService.findById(id).pipe().subscribe({
      next: (resp: any) => {
        console.log('Dados recebidos do backend:', resp)

        // Popula o botConfig com os dados recebidos
        this.botConfig = {
          id: id,
          name: resp.name,
          sessionId: resp.sessionId?._id || resp.sessionId || null,
          triggerKeyword: resp.triggerKeyword || '',
          isActive: resp.isActive !== undefined ? resp.isActive : true,
          enabled: resp.enabled,
          welcomeMessage: resp.welcomeMessage,
          defaultResponse: resp.defaultResponse,
          businessHours: resp.businessHours || {
            startTime: '',
            endTime: '',
            enabled: false,
            offHoursMessage: ''
          }
        }

        // Popula as autoResponses se existirem
        if (resp.autoResponses && Array.isArray(resp.autoResponses)) {
          this.autoResponses = resp.autoResponses.map((ar: any) => ({
            _id: ar._id,
            botConfig: ar.botConfig,
            triggerType: ar.triggerType,
            trigger: ar.trigger || '',
            enabled: ar.enabled,
            question: ar.question,
            action: ar.action,
            priority: ar.priority,
            options: ar.options || [],
            createdAt: ar.createdAt
          }))
          console.log('AutoResponses carregadas:', this.autoResponses)
        }

        console.log('BotConfig populado:', this.botConfig)
      },
      error: (err: any) => {
        console.error('Erro ao carregar bot:', err)
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar configurações do bot'
        })
      }
    })
  }
  ngOnDestroy(): void {
   //
  }

  onBack(): void {
    this.router.navigate(['/bot-config/list'])
  }

  onSubmit(): void {
    console.log('submit')
    if (this.botConfig.id) {
      console.log('UPDATE')
      this.update()
    } else {
      console.log('CREATE')
      this.create()
    }
  }

  create(): void {
    this.loading = true

    // Preparar dados para envio
    const createData = {
      name: this.botConfig.name,
      sessionId: this.botConfig.sessionId,
      triggerKeyword: this.botConfig.triggerKeyword,
      isActive: this.botConfig.isActive,
      enabled: this.botConfig.enabled,
      welcomeMessage: this.botConfig.welcomeMessage,
      defaultResponse: this.botConfig.defaultResponse,
      businessHours: this.botConfig.businessHours
    }

    console.log('Dados sendo enviados para create:', createData)

    this.botConfigService.create(createData).pipe().subscribe({
      next: (resp: any) => {
        console.log('Resposta do create:', resp)
        this.botConfig = {
          id: resp._id,
          name: resp.name,
          sessionId: resp.sessionId?._id || resp.sessionId || null,
          triggerKeyword: resp.triggerKeyword || '',
          isActive: resp.isActive !== undefined ? resp.isActive : true,
          enabled: resp.enabled,
          welcomeMessage: resp.welcomeMessage,
          defaultResponse: resp.defaultResponse,
          businessHours: resp.businessHours
        }
        this.loading = false
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Bot criado com sucesso!'
        })
        // Redirecionar para edição
        this.router.navigate(['/bot-config/edit', resp._id])
      },
      error: (err: any) => {
        console.log(err, ' <<<<<<< error')
        const message = err?.error?.message || 'Erro ao Salvar'
        this.messageService.add({ detail: message, severity: 'error', summary: 'Ops' })
        this.loading = false
      }
    })
  }
  update(): void {
    const id = this.botConfig?.id ?? ''
    if (id == '') {
      return
    }
    this.loading = true

    // Preparar dados para envio (remover campo 'id' que é apenas frontend)
    const updateData = {
      name: this.botConfig.name,
      sessionId: this.botConfig.sessionId, // Já é o _id correto
      triggerKeyword: this.botConfig.triggerKeyword,
      isActive: this.botConfig.isActive,
      enabled: this.botConfig.enabled,
      welcomeMessage: this.botConfig.welcomeMessage,
      defaultResponse: this.botConfig.defaultResponse,
      businessHours: this.botConfig.businessHours
    }

    console.log('Dados sendo enviados para update:', updateData)

    this.botConfigService.update(id, updateData).pipe().subscribe({
      next: (resp: any) => {
        console.log('Resposta do update:', resp)
        this.botConfig = {
          id: resp._id,
          name: resp.name,
          sessionId: resp.sessionId?._id || resp.sessionId || null,
          triggerKeyword: resp.triggerKeyword || '',
          isActive: resp.isActive !== undefined ? resp.isActive : true,
          enabled: resp.enabled,
          welcomeMessage: resp.welcomeMessage,
          defaultResponse: resp.defaultResponse,
          businessHours: resp.businessHours
        }
        this.loading = false
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Bot atualizado com sucesso!'
        })
      },
      error: (err: any) => {
        this.loading = false
        console.log(err, ' <<<<<<< error')
        const message = err?.error?.message || 'Erro ao Atualizar'
        this.messageService.add({ detail: message, severity: 'error', summary: 'Ops' })
      }
    })
  }

  loadSessions(): void {
    try {
      this.sessions = [
        { label: 'Nenhuma sessão', value: null }
      ];
      this.whatsappService.findAll({ enable: true }).pipe().subscribe({
        next: (resp: any) => {
          console.log('Sessões carregadas:', resp)
          resp.map((s: any) => {
            this.sessions.push({
              label: s.name,
              value: s._id || s.id // Usa o _id da sessão
            })
          })
          console.log('Sessions dropdown:', this.sessions)
        },
        error: (err: any) => {
          console.error('Erro ao carregar sessões:', err)
        }
      });
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }

  addResponse(): void {
    this.dialogResponses = true
    this.autoResponse = {
      botConfig: '',
      triggerType: 'regex',
      trigger: '',
      enabled: true,
      question: '',
      action: null,
      priority: 0,
      options: []
    }
    this.loadAvailableBots()
  }

  addOption(): void {
    if (!this.autoResponse.options) {
      this.autoResponse.options = []
    }
    this.autoResponse.options.push({
      value: '',
      text: '',
      nextStep: null,
      action: 'nextStep',
      targetBotId: null
    })
  }

  removeOption(index: number): void {
    if (this.autoResponse.options) {
      this.autoResponse.options.splice(index, 1)
    }
  }

  loadAvailableBots(): void {
    this.availableBots = []
    this.botConfigService.findAll({}).pipe().subscribe({
      next: (resp: any) => {
        this.availableBots = resp.data?.map((bot: any) => ({
          label: bot.name,
          value: bot._id
        })) || []
      },
      error: (err: any) => {
        console.error('Erro ao carregar bots disponíveis:', err)
      }
    })
  }

  saveAutoResponse(): void {
    if (!this.botConfig.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Salve o bot primeiro antes de adicionar interações'
      })
      return
    }

    // Definir o botConfig ID
    this.autoResponse.botConfig = this.botConfig.id

    if (this.autoResponse._id) {
      // UPDATE
      this.botConfigService.updateAutoResponse(
        this.botConfig.id,
        this.autoResponse._id,
        this.autoResponse
      ).subscribe({
        next: (resp) => {
          const index = this.autoResponses.findIndex(ar => ar._id === this.autoResponse._id)
          if (index !== -1) {
            this.autoResponses[index] = { ...resp }
          }
          this.autoResponses.sort((a, b) => a.priority - b.priority)
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Interação atualizada com sucesso!'
          })
          this.dialogResponses = false
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: err.error?.message || 'Erro ao atualizar interação'
          })
        }
      })
    } else {
      // CREATE
      this.botConfigService.createAutoResponse(
        this.botConfig.id,
        this.autoResponse
      ).subscribe({
        next: (resp) => {
          this.autoResponses.push(resp)
          this.autoResponses.sort((a, b) => a.priority - b.priority)
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Interação criada com sucesso!'
          })
          this.dialogResponses = false
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: err.error?.message || 'Erro ao criar interação'
          })
        }
      })
    }
  }

  editResponse(item: AutoResponse): void {
    this.autoResponse = { ...item }
    this.dialogResponses = true
    this.loadAvailableBots()
  }

  deleteResponse(id: string | undefined): void {
    if (!id || !this.botConfig.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID da interação não encontrado'
      })
      return
    }

    if (confirm('Tem certeza que deseja excluir esta interação?')) {
      this.botConfigService.deleteAutoResponse(this.botConfig.id, id).subscribe({
        next: () => {
          this.autoResponses = this.autoResponses.filter(ar => ar._id !== id)
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Interação excluída com sucesso!'
          })
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: err.error?.message || 'Erro ao excluir interação'
          })
        }
      })
    }
  }
}
