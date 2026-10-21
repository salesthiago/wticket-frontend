import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { ThemeService } from '../../../services/theme.service';
import { PlatformService } from '../services/platform.service';
import {
  PlatformLeadDashboard,
  PlatformLeadStatus,
  PlatformLeadStatusColors,
  PlatformLeadStatusLabels,
  PlatformLeadStatusSeverity
} from '../platform.interface';

const SEGMENT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#14b8a6', '#94a3b8'];

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  templateUrl: './platform-dashboard.component.html',
  providers: [MessageService],
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, ChartModule, SkeletonModule, TagModule, ToastModule, SidebarComponent]
})
export class PlatformDashboardComponent implements OnInit {
  private service = inject(PlatformService);
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  private textColor = '';
  private textColorSecondary = '';
  private surfaceBorder = '';

  loading = false;
  data: PlatformLeadDashboard | null = null;
  funnelChart: any = null;
  segmentChart: any = null;
  monthlyChart: any = null;

  ngOnInit(): void {
    this.themeService.isDarkTheme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.readThemeColors();
        if (this.data) this.buildCharts();
        this.cd.markForCheck();
      });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getLeadDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.buildCharts();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar o dashboard de leads' });
      }
    });
  }

  statusLabel(s: PlatformLeadStatus): string {
    return PlatformLeadStatusLabels[s] ?? s;
  }

  statusSeverity(s: PlatformLeadStatus) {
    return PlatformLeadStatusSeverity[s] ?? 'info';
  }

  private readThemeColors(): void {
    const docStyle = getComputedStyle(document.documentElement);
    this.textColor = docStyle.getPropertyValue('--p-text-color');
    this.textColorSecondary = docStyle.getPropertyValue('--p-text-color-secondary');
    this.surfaceBorder = docStyle.getPropertyValue('--p-surface-border');
  }

  private buildCharts(): void {
    const d = this.data!;

    this.funnelChart = {
      data: {
        labels: d.byStatus.map(s => s.label),
        datasets: [{
          label: 'Leads',
          data: d.byStatus.map(s => s.count),
          backgroundColor: d.byStatus.map(s => PlatformLeadStatusColors[s.status] + 'cc'),
          borderColor: d.byStatus.map(s => PlatformLeadStatusColors[s.status]),
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: { ...this.barOptions('Leads por status'), indexAxis: 'y' }
    };

    this.segmentChart = {
      data: {
        labels: d.bySegment.map(s => s.label),
        datasets: [{
          data: d.bySegment.map(s => s.count),
          backgroundColor: d.bySegment.map((_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: this.doughnutOptions('Leads por ramo')
    };

    this.monthlyChart = {
      data: {
        labels: d.monthly.map(m => m.label),
        datasets: [
          {
            label: 'Novos leads',
            data: d.monthly.map(m => m.new),
            backgroundColor: '#3b82f6aa',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: 'Fechados',
            data: d.monthly.map(m => m.won),
            backgroundColor: '#22c55eaa',
            borderColor: '#22c55e',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: this.barOptions('Novos leads vs fechados por mês', true)
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
        x: { beginAtZero: true, ticks: { color: this.textColorSecondary, precision: 0 }, grid: { color: this.surfaceBorder } },
        y: { beginAtZero: true, ticks: { color: this.textColorSecondary, precision: 0 }, grid: { color: this.surfaceBorder } }
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
}
