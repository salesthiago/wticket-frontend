import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AiAgent } from '../../ai-agent.interface';
import { AiAgentService } from '../../services/ai-agent.service';

@Component({
  selector: 'app-ai-agent-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './list.component.html'
})
export class AiAgentListComponent implements OnInit {
  @Input() agents: AiAgent[] = [];
  @Output() agentDeleted = new EventEmitter<string>();
  @Output() agentToggled = new EventEmitter<AiAgent>();

  tipoLabels: Record<string, string> = {
    atendimento: 'Atendimento',
    vendas: 'Vendas',
    campanhas: 'Campanhas',
    analise_leads: 'Análise de Leads'
  };

  tipoIcons: Record<string, string> = {
    atendimento: 'pi pi-headphones',
    vendas: 'pi pi-dollar',
    campanhas: 'pi pi-megaphone',
    analise_leads: 'pi pi-chart-bar'
  };

  tipoColors: Record<string, string> = {
    atendimento: 'info',
    vendas: 'success',
    campanhas: 'warning',
    analise_leads: 'secondary'
  };

  constructor(
    private router: Router,
    private aiAgentService: AiAgentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {}

  goToChat(agent: AiAgent): void {
    this.router.navigate(['/ai-agents', agent._id, 'chat']);
  }

  goToEdit(agent: AiAgent): void {
    this.router.navigate(['/ai-agents', agent._id, 'edit']);
  }

  confirmDelete(agent: AiAgent): void {
    this.confirmationService.confirm({
      message: `Deseja excluir o agente "${agent.nome}"? Todas as conversas serão removidas.`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.aiAgentService.delete(agent._id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Agente excluído' });
            this.agentDeleted.emit(agent._id!);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir agente' });
          }
        });
      }
    });
  }

  toggleStatus(agent: AiAgent): void {
    const newStatus = agent.status === 'ativo' ? 'inativo' : 'ativo';
    this.aiAgentService.update(agent._id!, { status: newStatus }).subscribe({
      next: (updated) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Agente ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`
        });
        this.agentToggled.emit(updated);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao alterar status' });
      }
    });
  }

  getTipoLabel(tipo: string): string {
    return this.tipoLabels[tipo] || tipo;
  }

  getTipoIcon(tipo: string): string {
    return this.tipoIcons[tipo] || 'pi pi-robot';
  }

  getTipoColor(tipo: string): string {
    return this.tipoColors[tipo] || 'secondary';
  }

  canChat(agent: AiAgent): boolean {
    return agent.tipo === 'atendimento' || agent.tipo === 'vendas';
  }
}
