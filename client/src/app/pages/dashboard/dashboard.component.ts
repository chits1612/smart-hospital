import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { AsyncPipe, NgClass, TitleCasePipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { HospitalService } from '../../services/hospital.service';
import { Patient } from '../../models/patient.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgClass, TitleCasePipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ecgCanvas')        ecgCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('occupancyCanvas')  occupancyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('admissionsCanvas') admissionsCanvas!: ElementRef<HTMLCanvasElement>;

  private ecgChart?: Chart;
  private occupancyChart?: Chart;
  private admissionsChart?: Chart;
  private subs = new Subscription();

  private svc   = inject(HospitalService);
  stats$    = this.svc.stats$;
  patients$ = this.svc.patients$;
  today     = new Date();

  constructor() {}

  ngAfterViewInit(): void {
    this.buildOccupancyChart();
    this.buildAdmissionsChart();
    this.buildEcgChart();

    this.subs.add(
      this.svc.ecg$.subscribe(data => {
        if (this.ecgChart) {
          this.ecgChart.data.datasets[0].data = data;
          this.ecgChart.update('none');
        }
      }),
    );
  }

  private buildEcgChart(): void {
    const ctx = this.ecgCanvas.nativeElement.getContext('2d')!;
    this.ecgChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(60).fill(''),
        datasets: [{
          data: [],
          borderColor: '#ffffff',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.15,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { display: false },
          y: { display: false, min: 30, max: 160 },
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  private buildOccupancyChart(): void {
    const data = this.svc.getBedOccupancy();
    const ctx = this.occupancyCanvas.nativeElement.getContext('2d')!;
    this.occupancyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.ward),
        datasets: [
          { label: 'Occupied',  data: data.map(d => d.occupied),           backgroundColor: '#ffffff', borderRadius: 3 },
          { label: 'Available', data: data.map(d => d.total - d.occupied), backgroundColor: '#1f1f1f', borderRadius: 3 },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { color: '#1a1a1a' }, ticks: { color: '#52525b', font: { size: 10 } } },
          y: { stacked: true, grid: { display: false },   ticks: { color: '#a1a1aa', font: { size: 11 } } },
        },
        plugins: {
          legend: { labels: { color: '#71717a', font: { size: 11 }, boxWidth: 10, padding: 12 } },
          tooltip: { backgroundColor: '#111', titleColor: '#fff', bodyColor: '#a1a1aa', borderColor: '#333', borderWidth: 1 },
        },
      },
    });
  }

  private buildAdmissionsChart(): void {
    const data = this.svc.getDailyAdmissions();
    const ctx = this.admissionsCanvas.nativeElement.getContext('2d')!;
    this.admissionsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.day),
        datasets: [{
          label: 'Admissions',
          data: data.map(d => d.count),
          backgroundColor: data.map((_, i) => i === data.length - 1 ? '#ffffff' : '#27272a'),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 11 } } },
          y: { grid: { color: '#1a1a1a' }, ticks: { color: '#71717a', font: { size: 11 } } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#111', titleColor: '#fff', bodyColor: '#a1a1aa', borderColor: '#333', borderWidth: 1 },
        },
      },
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      critical:   'text-red-400 bg-red-400/10',
      warning:    'text-amber-400 bg-amber-400/10',
      stable:     'text-green-400 bg-green-400/10',
      discharged: 'text-zinc-400 bg-zinc-800',
    };
    return map[status] ?? 'text-zinc-400 bg-zinc-800';
  }

  hrClass(hr: number): string {
    return hr > 100 || hr < 50 ? 'text-red-400' : hr > 90 ? 'text-amber-400' : 'text-white';
  }

  spo2Class(v: number): string {
    return v < 93 ? 'text-red-400' : v < 96 ? 'text-amber-400' : 'text-white';
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ecgChart?.destroy();
    this.occupancyChart?.destroy();
    this.admissionsChart?.destroy();
  }
}
