import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'status'
})
export class StatusPipe implements PipeTransform {

  transform(value: string, type: 'status' | 'priority' = 'status'): string {
    const maps: any = {
      status: {
        active: 'Ativo',
        inactive: 'Inativo',
        canceled: 'Cancelado',
        finished: 'Finalizado',
        in_progress: 'Em Progresso',
        open: 'Abrir',
        opened: 'Em Aberto',
        paused: 'Pausado'
      },
      priority: {
        high: 'Alta',
        low: 'Baixa'
      }
    };

    return maps[type]?.[value?.toLowerCase()] || value;
  }

}
