import { Component, OnInit, Input } from '@angular/core';
import { ApexChart, ApexXAxis, ApexDataLabels, ApexPlotOptions, ApexYAxis, ApexTooltip, ApexStroke, ApexFill, NgApexchartsModule } from 'ng-apexcharts';
import DatabaseService from '~/app/services/database.service';
import { NgIf } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

export type ChartOptions = {
  series: any;
  chart: ApexChart | any;
  xaxis: ApexXAxis | any;
  yaxis: ApexYAxis | any;
  plotOptions: ApexPlotOptions | any;
  dataLabels: ApexDataLabels | any;
  tooltip: ApexTooltip | any;
  stroke: ApexStroke | any;
  fill: ApexFill | any;
};

@Component({
  standalone: true,
  selector: 'app-change-history-chart',
  templateUrl: './change-history.component.html',
  styleUrls: ['./change-history.component.scss'],
  imports: [NgApexchartsModule, NgIf, PrimeNgModule],
})
export class ChangeHistoryChartComponent implements OnInit {
  @Input() domainName?: string;
  @Input() days: number = 14;

  public chartOptions: Partial<ChartOptions> | any;
  public loading = true;

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  private loadChartData() {
    this.loading = true;
    this.databaseService.instance.historyQueries.getChangeHistory(this.domainName, this.days).subscribe({
      next: (data) => {
        const chartData = this.prepareChartData(data);
        this.createChart(chartData);
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({
          message: 'Error fetching change history data',
          error,
          location: 'ChangeHistoryChartComponent.loadChartData',
        });
        this.loading = false;
      }
    });
  }

  private prepareChartData(data: any[]): { additions: number[], removals: number[], amendments: number[], days: string[] } {
    const additions: number[] = [];
    const removals: number[] = [];
    const amendments: number[] = [];
    const days: string[] = [];

    data.forEach((entry) => {
      days.push(entry.date);
      additions.push(entry.added || 0);
      removals.push(entry.removed || 0);
      amendments.push(entry.updated || 0);
    });

    return { additions, removals, amendments, days };
  }

  private createChart(chartData: { additions: number[], removals: number[], amendments: number[], days: string[] }) {
    this.chartOptions = {
      series: [
        { name: 'Additions', data: chartData.additions },
        { name: 'Removals', data: chartData.removals },
        { name: 'Amendments', data: chartData.amendments }
      ],
      chart: {
        type: 'bar',
        height: 350,
        stacked: true
      },
      plotOptions: {
        bar: {
          horizontal: false,
        },
      },
      xaxis: {
        categories: chartData.days,
      },
      yaxis: {
        title: {
          text: 'Number of Changes',
        },
      },
      tooltip: {
        y: {
          formatter: function (val: string) {
            return val + " changes";
          }
        }
      },
      fill: {
        opacity: 1,
        colors: ['#34D399', '#F87171', '#60A5FA'], // Green for added, red for removed, blue for amended
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['#fff']
      },
    };
  }
}
