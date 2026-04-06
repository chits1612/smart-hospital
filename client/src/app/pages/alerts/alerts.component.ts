import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { HospitalService } from '../../services/hospital.service';

interface HospitalAlert {
  id: string;
  timestamp: string;
  patientName: string;
  patientId: string;
  ward: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  acknowledged: boolean;
}

@Component({
  selector: 'app-alerts',
  imports: [NgClass, DatePipe],
  templateUrl: './alerts.component.html',
})
export class AlertsComponent implements OnInit, OnDestroy {
  activeFilter: 'all' | 'critical' | 'warning' | 'info' = 'all';
  alerts: HospitalAlert[] = [];

  private sub!: Subscription;

  constructor(private svc: HospitalService) {}

  ngOnInit(): void {
    this.sub = this.svc.alerts$.subscribe(a => (this.alerts = a as HospitalAlert[]));
  }

  get filtered(): HospitalAlert[] {
    return this.activeFilter === 'all'
      ? this.alerts
      : this.alerts.filter(a => a.severity === this.activeFilter);
  }

  unread(severity?: 'critical' | 'warning' | 'info'): number {
    return this.alerts.filter(a => !a.acknowledged && (!severity || a.severity === severity)).length;
  }

  acknowledge(alert: HospitalAlert): void {
    this.svc.acknowledgeAlert(alert.id).subscribe(() => {
      alert.acknowledged = true;
    });
  }

  severityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: 'text-red-400 bg-red-950 border-red-900/50',
      warning:  'text-amber-400 bg-amber-950/60 border-amber-900/50',
      info:     'text-blue-400 bg-blue-950/60 border-blue-900/50',
    };
    return icons[severity] ?? 'text-zinc-400 bg-zinc-900 border-zinc-800';
  }

  rowClass(a: HospitalAlert): string {
    if (a.acknowledged) return 'opacity-60';
    if (a.severity === 'critical') return 'bg-red-950/5';
    if (a.severity === 'warning')  return 'bg-amber-950/5';
    return '';
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
