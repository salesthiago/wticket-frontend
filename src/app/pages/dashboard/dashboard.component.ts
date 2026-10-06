import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from '../../services/auth.service';

interface DashboardOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChartModule,
    SelectModule,
    SidebarComponent,
    SkeletonModule,
    ToastModule,
    BreadcrumbModule
  ],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit {
  breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  breadcrumbItems: MenuItem[] = [{ label: 'Dashboard' }];

  private service = inject(DashboardService);
  private authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  private docStyle = getComputedStyle(document.documentElement);
  private textColor = this.docStyle.getPropertyValue('--p-text-color');
  private textColorSecondary = this.docStyle.getPropertyValue('--p-text-color-secondary');
  private surfaceBorder = this.docStyle.getPropertyValue('--p-surface-border');

  dashboardOptions: DashboardOption[] = [];
  selectedDashboard = '';
  loading = false;

  attendance: any = null;
  attendanceStatusChart: any = null;
  attendancePriorityChart: any = null;
  attendanceTrendChart: any = null;

  serviceOrder: any = null;
  soStatusChart: any = null;
  soPriorityChart: any = null;
  soTrendChart: any = null;

  platform: any = null;
  platformStatusChart: any = null;
  platformTrendChart: any = null;

  ngOnInit(): void {
    this.buildOptions();
    if (this.selectedDashboard) {
      this.loadDashboard();
    }
  }

  private buildOptions(): void {
    const opts: DashboardOption[] = [];
    const isSuperAdmin = this.authService.isSuperAdmin();
    const companyId = this.authService.getCompanyId();

    if (isSuperAdmin && !companyId) {
      opts.push({ label: 'Plataforma', value: 'platform' });
    }
    if (this.authService.hasModule('attendance' as any)) {
      opts.push({ label: 'Atendimento', value: 'attendance' });
    }
    if (this.authService.hasModule('service_order' as any)) {
      opts.push({ label: 'Ordens de Serviço', value: 'service_order' });
    }

    this.dashboardOptions = opts;
    if (opts.length > 0) this.selectedDashboard = opts[0].value;
  }

  onDashboardChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    if (!this.selectedDashboard) return;
    this.loading = true;
    if (this.selectedDashboard === 'attendance') {
      this.service.getAttendanceDashboard().subscribe({
        next: (data) => { this.attendance = data; this.buildAttendanceCharts(); this.done(); },
        error: () => { this.showError(); this.done(); }
      });
    } else if (this.selectedDashboard === 'service_order') {
      this.service.getServiceOrderDashboard().subscribe({
        next: (data) => { this.serviceOrder = data; this.buildSOCharts(); this.done(); },
        error: () => { this.showError(); this.done(); }
      });
    } else if (this.selectedDashboard === 'platform') {
      this.service.getPlatformDashboard().subscribe({
        next: (data) => { this.platform = data; this.buildPlatformCharts(); this.done(); },
        error: () => { this.showError(); this.done(); }
      });
    }
  }

  private done(): void {
    this.loading = false;
    this.cd.markForCheck();
  }

  private buildAttendanceCharts(): void {
    const d = this.attendance;
    this.attendanceStatusChart = {
      data: {
        labels: d.byStatus.map((s: any) => s.label),
        datasets: [{
          label: 'Tickets',
          data: d.byStatus.map((s: any) => s.count),
          backgroundColor: d.byStatus.map((s: any) => s.color + 'cc'),
          borderColor: d.byStatus.map((s: any) => s.color),
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: this.barOptions('Tickets por Status')
    };

    const p = d.byPriority;
    this.attendancePriorityChart = {
      data: {
        labels: ['Baixa', 'Média', 'Alta', 'Urgente'],
        datasets: [{
          data: [p.low, p.medium, p.high, p.urgent],
          backgroundColor: ['#22c55e', '#3b82f6', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: this.doughnutOptions('Prioridade')
    };

    this.attendanceTrendChart = {
      data: {
        labels: d.monthlyTrend.map((m: any) => m.label),
        datasets: [{
          label: 'Tickets Abertos',
          data: d.monthlyTrend.map((m: any) => m.count),
          backgroundColor: '#3b82f6aa',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: this.barOptions('Tickets por Mês')
    };
  }

  private buildSOCharts(): void {
    const d = this.serviceOrder;
    this.soStatusChart = {
      data: {
        labels: d.byStatus.map((s: any) => s.label),
        datasets: [{
          label: 'OS',
          data: d.byStatus.map((s: any) => s.count),
          backgroundColor: '#8b5cf6aa',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: this.barOptions('OS por Status')
    };

    const p = d.byPriority;
    this.soPriorityChart = {
      data: {
        labels: ['Baixa', 'Normal', 'Alta', 'Urgente'],
        datasets: [{
          data: [p.low, p.normal, p.high, p.urgent],
          backgroundColor: ['#22c55e', '#3b82f6', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: this.doughnutOptions('Prioridade')
    };

    this.soTrendChart = {
      data: {
        labels: d.monthlyTrend.map((m: any) => m.label),
        datasets: [{
          label: 'OS Emitidas',
          data: d.monthlyTrend.map((m: any) => m.count),
          backgroundColor: '#8b5cf6aa',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: this.barOptions('OS por Mês')
    };
  }

  private buildPlatformCharts(): void {
    const d = this.platform;
    const c = d.companies;
    this.platformStatusChart = {
      data: {
        labels: ['Ativas', 'Pendentes', 'Suspensas', 'Canceladas'],
        datasets: [{
          data: [c.active, c.pending_payment, c.suspended, c.cancelled],
          backgroundColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: this.doughnutOptions('Empresas por Status')
    };

    this.platformTrendChart = {
      data: {
        labels: d.monthlySignups.map((m: any) => m.label),
        datasets: [
          {
            label: 'Novos Cadastros',
            data: d.monthlySignups.map((m: any) => m.new),
            backgroundColor: '#22c55eaa',
            borderColor: '#22c55e',
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: 'Cancelamentos',
            data: d.monthlySignups.map((m: any) => m.cancelled),
            backgroundColor: '#ef4444aa',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: this.barOptions('Cadastros vs Cancelamentos por Mês', true)
    };
  }

  private barOptions(title: string, showLegend = false): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: showLegend, labels: { color: this.textColor } },
        title: { display: true, text: title, color: this.textColor, font: { size: 13, weight: 'bold' } }
      },
      scales: {
        x: { ticks: { color: this.textColorSecondary }, grid: { color: this.surfaceBorder } },
        y: { beginAtZero: true, ticks: { color: this.textColorSecondary }, grid: { color: this.surfaceBorder } }
      }
    };
  }

  private doughnutOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: this.textColor, usePointStyle: true, padding: 14 } },
        title: { display: true, text: title, color: this.textColor, font: { size: 13, weight: 'bold' } }
      }
    };
  }

  formatHours(hours: number | null): string {
    if (hours === null || hours === undefined) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours}h`;
    return `${(hours / 24).toFixed(1)}d`;
  }

  private showError(): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do dashboard' });
  }
}
