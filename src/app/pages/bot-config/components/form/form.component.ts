import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BotConfigService } from '../services/bot-config.service';
import { MessageModule } from 'primeng/message'

import { ButtonModule  } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { HeaderComponent } from 'src/app/layout/header/header.component';
import { SidebarComponent } from 'src/app/layout/sidebar/sidebar.component';
import { BotConfig } from 'src/app/components/interface/botConfig';
import { WhatsappService } from 'src/app/pages/whatsapp/components/services/whatsapp.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToggleSwitch } from "primeng/toggleswitch";
import { InputMaskModule } from "primeng/inputmask";
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from "primeng/table";
import { Dialog } from "primeng/dialog";

interface AutoResponse {
  _id?: string;
  botConfig?: string;
  triggerType: 'keyword' | 'exact_match' | 'regex';
  trigger: string;
  enabled: boolean;
  question: string;
  action: string | null;
  priority: number;
  createdAt?: string;
}

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
    Dialog
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
  sessions: any = [];
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
        this.botConfig = { ...resp }
        this.botConfig.id = id
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
    this.botConfigService.create({ ...this.botConfig }).pipe().subscribe({
      next: (resp: any) => {
        this.botConfig = { ...resp }
        this.botConfig.id = resp._id
        this.loading = false
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
    this.botConfigService.update(id, { ...this.botConfig }).pipe().subscribe({
      next: (resp: any) => {
        this.botConfig = { ...resp }
        this.botConfig.id = resp._id
        this.loading = false
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

  addResponse(): void {
    this.dialogResponses = true
    this.autoResponse = {
     botConfig: '',
      triggerType: 'regex',
      trigger: '',
      enabled: true,
      question: '',
      action: null,
      priority: 0
    }
  }
}
