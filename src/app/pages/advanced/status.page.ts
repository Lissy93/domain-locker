import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { serviceLinks, type LinkItem } from '~/app/constants/admin-links';

export interface StatusSummary {
  service: string;
  status: string;
  details: string;
  link?: string;
  serviceMeta?: LinkItem;
}

export interface StatusLog {
  service: string;
  date: string;
  details: string;
  link: string;
  severity: string;
  serviceMeta?: LinkItem;
}

export interface StatusData {
  summary: StatusSummary[];
  history: StatusLog[];
  scheduled: StatusLog[];
}

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent],
  templateUrl: './status.page.html',
})
export default class StatusPage {
  readonly statusInfo$: Observable<StatusData> = this.fetchStatusData();
  public historyChartUrl: string = '';
  public pieChartUrl: string = '';

  // Toggle flags for showing more/less incidents.
  public showAllHistory: boolean = false;
  public showAllScheduled: boolean = false;

  public dlServicesToSetup: string[] = ['App', 'API', 'Database', 'Auth', 'Scheduler'];

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
  ) {
    // Generate the chart once we have API data.
    this.statusInfo$.subscribe(data => {
      const chartConfig = this.generateChartConfig(data, { daysBefore: 7, daysAfter: 7, title: 'Incident History' });
      this.historyChartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartConfig));
      const servicePieConfig = this.generatePieChartConfig(data, 'service',  { title: 'Issues per Service' });
      this.pieChartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(servicePieConfig));
    });
  }

  private fetchStatusData(): Observable<StatusData> {
    return this.http.get<StatusData>('/api/status-info').pipe(
      map(data => ({
        summary: this.enrichList(data.summary),
        history: this.enrichList(data.history),
        scheduled: this.enrichList(data.scheduled),
      })),
      catchError(error => {
        this.errorHandler.handleError({
          error,
          message: 'Failed to load status data',
          location: 'status-info',
          showToast: true,
        });
        return of({ summary: [], history: [], scheduled: [] });
      })
    );
  }

  private enrichList<T extends { service: string }>(list: T[]): T[] {
    return list.map(item => ({
      ...item,
      serviceMeta: serviceLinks.find(link =>
        link.provider.toLowerCase() === item.service.toLowerCase()
      ),
    }));
  }

  private getCssVariableColor = (cssVarName: string, fallback: string = '#cccccc'): string => {
    if (typeof window === 'undefined' || !window?.getComputedStyle) {
      return fallback;
    }
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(cssVarName)?.trim();
    return /^#([0-9A-F]{3}){1,2}$/i.test(value) ? value : fallback;
  }

  /**
   * Generates a Chart.js configuration object for a stacked bar chart.
   *
   * The chart shows, for each day:
   *  - History incidents grouped into Critical (red), Minor (orange), and Other (yellow).
   *  - Scheduled (upcoming) incidents (in purple pattern).
   *  - A line dataset for the total issues.
   *
   * Configurable options include the number of days before and after today, and the chart title.
   */
  private generateChartConfig(
    statusData: StatusData,
    options?: { daysBefore?: number; daysAfter?: number; title?: string; }
  ): any {
    // Configurable options.
    const DAYS_BEFORE = options?.daysBefore ?? 7;
    const DAYS_AFTER = options?.daysAfter ?? 7;
    const chartTitle = options?.title ?? 'Incident History';

    const totalDays = DAYS_BEFORE + DAYS_AFTER + 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - DAYS_BEFORE);

    // Prepare labels and initialize counts.
    const labels: string[] = [];
    const criticalData = new Array(totalDays).fill(0);
    const minorData = new Array(totalDays).fill(0);
    const otherData = new Array(totalDays).fill(0);
    const upcomingData = new Array(totalDays).fill(0);
    const totalData = new Array(totalDays).fill(0);

    // Helper to format a date as "May 01".
    const formatLabel = (d: Date): string => {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' };
      return d.toLocaleDateString('en-US', options);
    };

    // Generate labels.
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      labels.push(formatLabel(d));
    }

    // Helper to compute day index in our date range.
    const getDayIndex = (d: Date): number => {
      const diffTime = d.getTime() - startDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // Process history items (past and present only).
    statusData.history.forEach(item => {
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);
      const idx = getDayIndex(d);
      if (idx < 0 || idx >= totalDays) return;
      // Categorize: if severity contains "critical" or equals ❌, etc.
      const sev = item.severity.toLowerCase();
      if (sev.includes('critical') || sev === '❌') {
        criticalData[idx]++;
      } else if (sev.includes('minor') || sev === '⚠️') {
        minorData[idx]++;
      } else {
        otherData[idx]++;
      }
    });

    // Process scheduled items (future only).
    statusData.scheduled.forEach(item => {
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);
      const idx = getDayIndex(d);
      if (idx < 0 || idx >= totalDays) return;
      if (d.getTime() > today.getTime()) {
        upcomingData[idx]++;
      }
    });

    // Calculate total issues for each day.
    for (let i = 0; i < totalDays; i++) {
      totalData[i] = criticalData[i] + minorData[i] + otherData[i] + upcomingData[i];
    }

    // Colors and styling (adjustable).
    const criticalColor = this.getCssVariableColor('--red-400', '#E92546');
    const minorColor = this.getCssVariableColor('--orange-400', '#EF9126');
    const otherColor = this.getCssVariableColor('--yellow-400', '#D9ED07');
    const upcomingColor = this.getCssVariableColor('--blue-400', '#a78bfa');
    const totalColor = this.getCssVariableColor('--teal-400', '#36a2eb');

    // Build the Chart.js configuration.
    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Total',
            borderColor: totalColor,
            borderWidth: 2,
            fill: false,
            data: totalData,
          },
          {
            label: 'Critical',
            backgroundColor: criticalColor,
            data: criticalData,
          },
          {
            label: 'Minor',
            backgroundColor: minorColor,
            data: minorData,
          },
          {
            label: 'Other',
            backgroundColor: otherColor,
            data: otherData,
          },
          {
            label: 'Upcoming',
            data: upcomingData,
            // backgroundColor: `pattern.draw('diagonal-right-left', '${upcomingColor}')`,
            backgroundColor: upcomingColor,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: chartTitle,
          fontColor: this.getCssVariableColor('--text-color', '#6d6d6d'),
        },
        scales: {
          xAxes: [{ stacked: true }],
          yAxes: [{ stacked: true }],
        },
        annotation: {
          annotations: [{
            type: 'line',
            mode: 'vertical',
            scaleID: 'x-axis-0',
            value: DAYS_BEFORE,
            borderColor: upcomingColor,
            borderWidth: 3,
            backgroundColor: 'rgba(109, 109, 109, 0.2)',
            label: {
              enabled: true,
              content: 'Today'
            }
          }],
        },
      },
    };
    return config;
  }

  
  /**
   * Generates a Pie Chart configuration.
   *
   * @param statusData The complete status data from your API.
   * @param breakdownType 'service' for total issues per service
   *                      'severity' for issues aggregated by severity.
   * @param options Configurable options (currently supports chart title).
   *
   * @returns A Chart.js configuration object.
   */
  private generatePieChartConfig(
    statusData: StatusData,
    breakdownType: 'service' | 'severity',
    options?: { title?: string }
  ): any {
    // Combine both history and scheduled items.
    const allItems = [...statusData.history, ...statusData.scheduled];
    const counts: { [key: string]: number } = {};

    if (breakdownType === 'service') {
      // Count total issues per service.
      allItems.forEach(item => {
        const key = item.service;
        counts[key] = (counts[key] || 0) + 1;
      });
      const labels = Object.keys(counts);
      const data = labels.map(label => counts[label]);
      // Default palette for services.
      const palette = [
        this.getCssVariableColor('--blue-400', '#36A2EB'),
        this.getCssVariableColor('--teal-400', '#4BC0C0'),
        this.getCssVariableColor('--purple-400', '#9966FF'),
        this.getCssVariableColor('--orange-400', '#FF9F40'),
        this.getCssVariableColor('--red-400', '#E92546'),
        this.getCssVariableColor('--yellow-400', '#FFD700'),
        this.getCssVariableColor('--green-400', '#4CAF50'),
        this.getCssVariableColor('--pink-400', '#FF4081'),
        this.getCssVariableColor('--indigo-400', '#3F51B5'),
        this.getCssVariableColor('--gray-400', '#9E9E9E'),
        this.getCssVariableColor('--cyan-400', '#00BCD4'),
        this.getCssVariableColor('--purple-400', '#CDDC39'),
      ];
      const backgroundColor = labels.map((_, i) => palette[i % palette.length]);

      return {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColor,
          }]
        },
        options: {
          title: {
            display: true,
            text: options?.title || 'Issues per Service',
            fontColor: this.getCssVariableColor('--text-color', '#6d6d6d'),
          }
        }
      };
    } else if (breakdownType === 'severity') {
      // Count issues per severity.
      allItems.forEach(item => {
        const key = item.severity.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
      const labels = Object.keys(counts);
      const data = labels.map(label => counts[label]);
      // Map severity keys to fixed colors.
      const severityColors: { [key: string]: string } = {
        'critical': '#E92546',
        'minor': '#EF9126',
        'info': '#36A2EB',
        'operational': '#4BC0C0',
        'unknown': '#999999',
        'upcoming': '#a78bfa'
      };
      const backgroundColor = labels.map(label => severityColors[label] || '#FFD700');

      return {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: backgroundColor,
          }]
        },
        options: {
          title: {
            display: true,
            text: options?.title || 'Issues by Severity',
            fontColor: this.getCssVariableColor('--text-color', '#6d6d6d'),
          }
        }
      };
    }
    return {};
  }

}
