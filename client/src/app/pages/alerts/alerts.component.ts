import { Component } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';

interface HospitalAlert {
  id: string;
  timestamp: Date;
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
export class AlertsComponent {
  activeFilter: 'all' | 'critical' | 'warning' | 'info' = 'all';

  alerts: HospitalAlert[] = [
    { id: 'A001', timestamp: new Date('2026-04-06T14:32:00'), patientName: 'James Wilson',     patientId: 'P001', ward: 'ICU',          type: 'High Heart Rate',         message: 'Heart rate exceeded threshold — current: 102 bpm (limit: 100)',   severity: 'critical', acknowledged: false },
    { id: 'A002', timestamp: new Date('2026-04-06T14:28:00'), patientName: 'Robert Chen',      patientId: 'P003', ward: 'ICU',          type: 'Low SpO2',                message: 'Blood oxygen critically low — current: 91% (limit: 92%)',          severity: 'critical', acknowledged: false },
    { id: 'A003', timestamp: new Date('2026-04-06T14:15:00'), patientName: 'Michael Thompson', patientId: 'P005', ward: 'Orthopedics',  type: 'Elevated Temperature',    message: 'Temperature above normal — current: 37.5°C (limit: 37.5°C)',      severity: 'warning',  acknowledged: false },
    { id: 'A004', timestamp: new Date('2026-04-06T14:10:00'), patientName: 'Linda Park',       patientId: 'P006', ward: 'ICU',          type: 'High Blood Pressure',     message: 'Systolic BP elevated — current: 140 mmHg (threshold: 135)',       severity: 'warning',  acknowledged: true  },
    { id: 'A005', timestamp: new Date('2026-04-06T13:55:00'), patientName: 'James Wilson',     patientId: 'P001', ward: 'ICU',          type: 'Medication Overdue',      message: 'Scheduled medication overdue by 15 minutes',                       severity: 'info',     acknowledged: true  },
    { id: 'A006', timestamp: new Date('2026-04-06T13:40:00'), patientName: 'Sarah Mitchell',   patientId: 'P002', ward: 'Cardiology',   type: 'Lab Results Ready',       message: 'New cardiac panel results available for review',                   severity: 'info',     acknowledged: true  },
    { id: 'A007', timestamp: new Date('2026-04-06T13:20:00'), patientName: 'Robert Chen',      patientId: 'P003', ward: 'ICU',          type: 'Critical Deterioration',  message: 'Rapid deterioration of respiratory function detected',             severity: 'critical', acknowledged: true  },
    { id: 'A008', timestamp: new Date('2026-04-06T12:57:00'), patientName: 'Patricia Santos',  patientId: 'P010', ward: 'General',      type: 'Fall Risk Alert',         message: 'Patient attempted to leave bed unassisted',                        severity: 'warning',  acknowledged: true  },
  ];

  get filtered(): HospitalAlert[] {
    return this.activeFilter === 'all'
      ? this.alerts
      : this.alerts.filter(a => a.severity === this.activeFilter);
  }

  unread(severity?: 'critical' | 'warning' | 'info'): number {
    return this.alerts.filter(a => !a.acknowledged && (!severity || a.severity === severity)).length;
  }

  acknowledge(alert: HospitalAlert): void {
    alert.acknowledged = true;
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
}
