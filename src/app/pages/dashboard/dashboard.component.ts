import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SidebarComponent } from "../../layout/sidebar/sidebar.component";
import { DashboardService } from './services/dashboard.service';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule,
    SidebarComponent,
    SkeletonModule,
    ToastModule,
    BreadcrumbModule
  ],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit, OnDestroy {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Dashboard' }];
  private service = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  dashboard: any = null;
  loading = true;

  // Gráficos
  priorityChart: any;
  statusChart: any;
  hourlyChart: any;
  weeklyChart: any;
  monthlyChart: any;

  // Opções comuns para gráficos
  private documentStyle = getComputedStyle(document.documentElement);
  private textColor = this.documentStyle.getPropertyValue('--p-text-color');
  private textColorSecondary = this.documentStyle.getPropertyValue('--p-text-color-secondary');
  private surfaceBorder = this.documentStyle.getPropertyValue('--p-surface-border');

  ngOnInit(): void {
    this.listDashboard();
  }

  ngOnDestroy(): void {
    // Cleanup se necessário
  }

  listDashboard() {
    this.loading = true;
    this.service.findDashboardTickets({}).subscribe({
      next: (resp: any) => {
        this.dashboard = resp.data;
        this.initCharts();
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar dados do dashboard'
        });
        this.loading = false;
        this.cd.markForCheck();
      }
    });
  }

  private initCharts(): void {
    this.initPriorityChart();
    this.initStatusChart();
    this.initHourlyChart();
    this.initWeeklyChart();
    this.initMonthlyChart();
  }

  private initPriorityChart(): void {
    const priorityData = this.dashboard.summary.priorityBreakdown;

    this.priorityChart = {
      data: {
        labels: Object.keys(priorityData).map(key => this.formatPriorityLabel(key)),
        datasets: [
          {
            data: Object.values(priorityData),
            backgroundColor: [
              this.documentStyle.getPropertyValue('--p-green-500'),
              this.documentStyle.getPropertyValue('--p-blue-500'),
              this.documentStyle.getPropertyValue('--p-orange-500'),
              this.documentStyle.getPropertyValue('--p-red-500')
            ],
            hoverBackgroundColor: [
              this.documentStyle.getPropertyValue('--p-green-400'),
              this.documentStyle.getPropertyValue('--p-blue-400'),
              this.documentStyle.getPropertyValue('--p-orange-400'),
              this.documentStyle.getPropertyValue('--p-red-400')
            ],
            borderWidth: 2,
            borderColor: this.documentStyle.getPropertyValue('--p-surface-card')
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.textColor,
              usePointStyle: true,
              padding: 20
            }
          },
          title: {
            display: true,
            text: 'Distribuição por Prioridade',
            color: this.textColor,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  private initStatusChart(): void {
    const statusData = this.dashboard.statusBreakdown;

    this.statusChart = {
      data: {
        labels: statusData.map((item: any) => item.status),
        datasets: [
          {
            data: statusData.map((item: any) => item.count),
            backgroundColor: [
              this.documentStyle.getPropertyValue('--p-primary-500'),
              this.documentStyle.getPropertyValue('--p-success-500'),
              this.documentStyle.getPropertyValue('--p-warning-500'),
              this.documentStyle.getPropertyValue('--p-danger-500'),
              this.documentStyle.getPropertyValue('--p-help-500')
            ],
            borderWidth: 2,
            borderColor: this.documentStyle.getPropertyValue('--p-surface-card')
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.textColor,
              usePointStyle: true,
              padding: 20
            }
          },
          title: {
            display: true,
            text: 'Status dos Tickets',
            color: this.textColor,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };
  }

  private initHourlyChart(): void {
    const hourlyData = this.dashboard.timeAnalysis.byHour;

    this.hourlyChart = {
      data: {
        labels: hourlyData.map((item: any) => `${item.hour}:00`),
        datasets: [
          {
            label: 'Tickets por Hora',
            data: hourlyData.map((item: any) => item.count),
            backgroundColor: this.documentStyle.getPropertyValue('--p-primary-200'),
            borderColor: this.documentStyle.getPropertyValue('--p-primary-500'),
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: this.textColor
            }
          },
          title: {
            display: true,
            text: 'Tickets por Hora do Dia',
            color: this.textColor,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: this.textColorSecondary
            },
            grid: {
              color: this.surfaceBorder
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: this.textColorSecondary
            },
            grid: {
              color: this.surfaceBorder
            }
          }
        }
      }
    };
  }

  private initWeeklyChart(): void {
    const weeklyData = this.dashboard.timeAnalysis.thisWeek;

    this.weeklyChart = {
      data: {
        labels: weeklyData.map((item: any) => this.formatDayLabel(item.day)),
        datasets: [
          {
            label: 'Tickets na Semana',
            data: weeklyData.map((item: any) => item.count),
            backgroundColor: this.documentStyle.getPropertyValue('--p-success-200'),
            borderColor: this.documentStyle.getPropertyValue('--p-success-500'),
            borderWidth: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: this.textColor
            }
          },
          title: {
            display: true,
            text: 'Tickets na Semana Atual',
            color: this.textColor,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: this.textColorSecondary
            },
            grid: {
              color: this.surfaceBorder
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: this.textColorSecondary
            },
            grid: {
              color: this.surfaceBorder
            }
          }
        }
      }
    };
  }

  private initMonthlyChart(): void {
    const monthlyData = this.dashboard.timeAnalysis.thisMonth;

    this.monthlyChart = {
      data: {
        labels: monthlyData.map((item: any) => item.date),
        datasets: [
          {
            label: 'Tickets no Mês',
            data: monthlyData.map((item: any) => item.count),
            backgroundColor: this.documentStyle.getPropertyValue('--p-warning-200'),
            borderColor: this.documentStyle.getPropertyValue('--p-warning-500'),
            borderWidth: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: this.textColor
            }
          },
          title: {
            display: true,
            text: 'Tickets no Mês Atual',
            color: this.textColor,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: this.textColorSecondary,
              maxTicksLimit: 10
            },
            grid: {
              color: this.surfaceBorder
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: this.textColorSecondary
            },
            grid: {
              color: this.surfaceBorder
            }
          }
        }
      }
    };
  }

  private formatPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  }

  private formatDayLabel(day: string): string {
    const days: { [key: string]: string } = {
      'monday': 'Seg',
      'tuesday': 'Ter',
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    };
    return days[day.toLowerCase()] || day;
  }

  refreshDashboard(): void {
    this.listDashboard();
  }

  getSummaryCards(): any[] {
    if (!this.dashboard) return [];

    return [
      {
        title: 'Total de Tickets',
        value: this.dashboard.summary.totalTickets,
        icon: 'pi pi-ticket',
        color: 'bg-blue-500'
      },
      {
        title: 'Total de Mensagens',
        value: this.dashboard.summary.totalMessages,
        icon: 'pi pi-comments',
        color: 'bg-green-500'
      },
      {
        title: 'Média de Mensagens',
        value: this.dashboard.summary.avgMessagesAll.toFixed(1),
        icon: 'pi pi-chart-bar',
        color: 'bg-orange-500'
      },
      {
        title: 'Ticket Mais Antigo',
        value: this.dashboard.summary.oldestTicket ?
               new Date(this.dashboard.summary.oldestTicket).toLocaleDateString('pt-BR') : 'N/A',
        icon: 'pi pi-calendar-minus',
        color: 'bg-purple-500'
      }
    ];
  }
}
