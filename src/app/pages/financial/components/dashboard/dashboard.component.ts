import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { Toast } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar.component';
import { FinancialService } from '../services/financial.service';
import {
  Receivable,
  ReceivableDashboard,
  ReceivableStatus,
  ReceivableStatusLabels,
  ReceivableStatusColors
} from '../../financial.interface';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    ChartModule,
    TableModule,
    DatePickerModule,
    Toast,
    TooltipModule,
    BreadcrumbModule,
    DividerModule,
    SkeletonModule,
    SidebarComponent
  ]
})
export class FinancialDashboardComponent implements OnInit {
  private cd = inject(ChangeDetectorRef);

  loading = true;
  loadingLists = true;

  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Financeiro' }, { label: 'Dashboard' }];

  // Filtro de período (default = mês corrente)
  periodRange: Date[] | null = this.defaultPeriod();

  summary: ReceivableDashboard | null = null;
  upcomingDue: Receivable[] = [];
  overdueList: Receivable[] = [];

  statusChart: any;

  constructor(
    private financial: FinancialService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private defaultPeriod(): Date[] {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return [start, end];
  }

  private periodParams() {
    return {
      dueFrom: this.periodRange?.[0]?.toISOString(),
      dueTo: this.periodRange?.[1]?.toISOString()
    };
  }

  load() {
    this.loading = true;
    this.loadingLists = true;
    const params = this.periodParams();

    this.financial.getDashboard(params).subscribe({
      next: (resp) => {
        this.summary = resp;
        this.buildChart();
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error', summary: 'Erro',
          detail: err?.error?.message || 'Falha ao carregar dashboard'
        });
      }
    });

    // Próximos vencimentos (próximos 30 dias) — sempre globais (sem filtro de período)
    const today = new Date();
    const in30Days = new Date(); in30Days.setDate(today.getDate() + 30);
    this.financial.listReceivables({
      status: 'pending',
      dueFrom: today.toISOString(),
      dueTo: in30Days.toISOString(),
      limit: 10
    }).subscribe({
      next: (resp) => {
        this.upcomingDue = (resp?.records || []).slice(0, 10);
        this.checkListsLoaded();
      },
      error: () => this.checkListsLoaded()
    });

    // Em atraso — sempre globais (todos os atrasados)
    this.financial.listReceivables({
      status: 'overdue',
      limit: 10
    }).subscribe({
      next: (resp) => {
        this.overdueList = (resp?.records || []).slice(0, 10);
        this.checkListsLoaded();
      },
      error: () => this.checkListsLoaded()
    });
  }

  private listsPending = 2;
  private checkListsLoaded() {
    this.listsPending--;
    if (this.listsPending <= 0) {
      this.loadingLists = false;
      this.listsPending = 2;
      this.cd.markForCheck();
    }
  }

  resetPeriod() {
    this.periodRange = this.defaultPeriod();
    this.load();
  }

  private buildChart() {
    if (!this.summary) return;
    const docStyle = getComputedStyle(document.documentElement);
    const textColor = docStyle.getPropertyValue('--p-text-color');
    const surfaceCard = docStyle.getPropertyValue('--p-surface-card');

    const labels = ['Aguardando', 'Em Atraso', 'Pago', 'Cancelado'];
    const data = [
      this.summary.pending.count,
      this.summary.overdue.count,
      this.summary.paid.count,
      this.summary.cancelled.count
    ];

    this.statusChart = {
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            docStyle.getPropertyValue('--p-yellow-500') || '#eab308',
            docStyle.getPropertyValue('--p-red-500') || '#ef4444',
            docStyle.getPropertyValue('--p-green-500') || '#22c55e',
            docStyle.getPropertyValue('--p-surface-400') || '#a1a1aa'
          ],
          borderWidth: 2,
          borderColor: surfaceCard
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, usePointStyle: true, padding: 16 }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: ${ctx.raw} (${pct}%)`;
              }
            }
          }
        }
      }
    };
  }

  // Helpers ─────────────────────────────────────────────────────────────────
  statusLabel(s: ReceivableStatus): string { return ReceivableStatusLabels[s] || s; }
  statusColor(s: ReceivableStatus): string { return ReceivableStatusColors[s] || 'secondary'; }

  customerName(r: Receivable): string {
    if (typeof r.customerId === 'object' && r.customerId) return r.customerId.name || '—';
    return '—';
  }

  serviceOrderLabel(r: Receivable): string {
    if (typeof r.serviceOrderId === 'object' && r.serviceOrderId) return r.serviceOrderId.orderNumber || '';
    return '';
  }

  daysToDue(r: Receivable): number | null {
    if (!r.dueDate) return null;
    const due = new Date(r.dueDate); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  view(id?: string) { if (id) this.router.navigate(['/financial/receivables/view', id]); }
  goToReceivablesByStatus(status?: ReceivableStatus) {
    this.router.navigate(['/financial/receivables'], { queryParams: status ? { status } : {} });
  }
}
