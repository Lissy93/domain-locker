import { Component, OnInit, ViewChild, AfterViewInit, PLATFORM_ID, Inject, ElementRef, Input } from "@angular/core";
import { ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexLegend, ApexStroke } from "ng-apexcharts";
import DatabaseService from '~/app/services/database.service';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { NgIf } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorHandlerService } from "~/app/services/error-handler.service";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  legend: ApexLegend;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: 'app-domain-pie-charts',
  templateUrl: './domain-pie.component.html',
  styleUrl: './domain-pie.component.scss',
  standalone: true,
  imports: [NgApexchartsModule, NgIf, PrimeNgModule, TranslateModule]
})
export class DomainPieChartsComponent implements OnInit, AfterViewInit {
  @ViewChild("registrarChart") registrarChart!: ChartComponent;
  @ViewChild("sslIssuerChart") sslIssuerChart!: ChartComponent;
  @ViewChild("hostChart") hostChart!: ChartComponent;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  @Input() listMode: boolean = false;

  public registrarChartOptions: Partial<ChartOptions> | any = {};
  public sslIssuerChartOptions: Partial<ChartOptions> | any = {};
  public hostChartOptions: Partial<ChartOptions> | any = {};

  public registrarDataLoaded = false;
  public sslIssuerDataLoaded = false;
  public hostDataLoaded = false;

  public registrarChartReady = false;
  public sslIssuerChartReady = false;
  public hostChartReady = false;

  public activeTabIndex = 0; // Track the active tab

  private colors: string[] = [];
  
  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setChartColors();
      this.loadRegistrarData();
      if (this.listMode) {
        this.loadSslIssuerData();
        this.loadHostData();
      }
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setChartSize();
    }
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    if (event.index === 0) {
      this.loadRegistrarData();
    } else if (event.index === 1) {
      this.loadSslIssuerData();
    } else if (event.index === 2) {
      this.loadHostData();
    }
    setTimeout(() => this.forceChartRedraw(event.index), 100);
  }

  forceChartRedraw(index: number) {
    if (index === 0 && this.registrarChartReady) {
      this.registrarChartOptions = { ...this.registrarChartOptions };
    } else if (index === 1 && this.sslIssuerChartReady) {
      this.sslIssuerChartOptions = { ...this.sslIssuerChartOptions };
    } else if (index === 2 && this.hostChartReady) {
      this.hostChartOptions = { ...this.hostChartOptions };
    }
  }

  loadRegistrarData() {
    this.getRegistrarData().pipe(
      tap(data => {
        this.initChartOptions('registrar', data);
        this.registrarDataLoaded = true;
        this.registrarChartReady = true;
      })
    ).subscribe();
  }

  loadSslIssuerData() {
    this.getSslIssuerData().pipe(
      tap(data => {
        this.initChartOptions('sslIssuer', data);
        this.sslIssuerDataLoaded = true;
        this.sslIssuerChartReady = true;
      })
    ).subscribe();
  }

  loadHostData() {
    this.getHostData().pipe(
      tap(data => {
        this.initChartOptions('host', data);
        this.hostDataLoaded = true;
        this.hostChartReady = true;
      })
    ).subscribe();
  }

  initChartOptions(chartType: 'registrar' | 'sslIssuer' | 'host', data: {name: string, count: number}[]) {
    const baseOptions: Partial<ChartOptions> | any = {
      series: data.map(item => item.count),
      labels: data.map(item => item.name || 'No Data'),
      chart: {
        type: "pie",
        background: 'transparent',
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: '100%'
          },
        }
      }],
      theme: {
        mode: 'dark',
        palette: 'palette1',
      },
      legend: {
        position: 'bottom',
        show: false,
        labels: {
          colors: 'var(--surface-500)'
        }
      },
      stroke: {
        colors: ['var(--surface-100)']
      },
      colors: this.colors
    } as ApexNonAxisChartSeries | ApexChart | ApexResponsive | ApexTheme | ApexLegend | ApexStroke;

    if (chartType === 'registrar') {
      this.registrarChartOptions = baseOptions;
    } else if (chartType === 'sslIssuer') {
      this.sslIssuerChartOptions = baseOptions;
    } else if (chartType === 'host') {
      this.hostChartOptions = baseOptions;
    }

    this.setChartSize();
  }

  getRegistrarData(): Observable<{name: string, count: number}[]> {
    return this.databaseService.instance.registrarQueries.getDomainCountsByRegistrar().pipe(
      map(counts => Object.entries(counts).map(([name, count]) => ({ name, count }))),
      catchError(error => {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch registrar data',
          location: 'DomainPieChartsComponent.getRegistrarData',
        });
        return of([]);
      })
    );
  }

  getSslIssuerData(): Observable<{name: string, count: number}[]> {
    return this.databaseService.instance.sslQueries.getSslIssuersWithDomainCounts().pipe(
      map(data => data.map(item => ({ name: item.issuer, count: item.domain_count }))),
      catchError(error => {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch SSL issuer data',
          location: 'DomainPieChartsComponent.getSslIssuerData',
        });
        return of([]);
      })
    );
  }

  getHostData(): Observable<{name: string, count: number}[]> {
    return this.databaseService.instance.hostsQueries.getHostsWithDomainCounts().pipe(
      map(data => data.map(item => ({ name: item.isp, count: item.domain_count }))),
      catchError(error => {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch host data',
          location: 'DomainPieChartsComponent.getHostData',
        });
        return of([]);
      })
    );
  }

  setChartColors() {
    if (isPlatformBrowser(this.platformId)) {
      const style = getComputedStyle(document.body);
      this.colors = [
        style.getPropertyValue('--purple-400'),
        style.getPropertyValue('--blue-400'),
        style.getPropertyValue('--green-400'),
        style.getPropertyValue('--cyan-400'),
        style.getPropertyValue('--indigo-400'),
        style.getPropertyValue('--teal-400'),
        style.getPropertyValue('--pink-400'),
        style.getPropertyValue('--yellow-400'),
        style.getPropertyValue('--orange-400'),
        style.getPropertyValue('--red-000')
      ];
    }
  }

  setChartSize() {
    if (this.chartContainer) {
      const { width, height } = this.chartContainer.nativeElement.getBoundingClientRect();
      const chartSize = {
        width: '90%',
        height: height,
      };
      if (this.registrarChartOptions.chart) {
        this.registrarChartOptions.chart = { ...this.registrarChartOptions.chart, ...chartSize };
      }
      if (this.sslIssuerChartOptions.chart) {
        this.sslIssuerChartOptions.chart = { ...this.sslIssuerChartOptions.chart, ...chartSize };
      }
      if (this.hostChartOptions.chart) {
        this.hostChartOptions.chart = { ...this.hostChartOptions.chart, ...chartSize };
      }
    }
  }
}
