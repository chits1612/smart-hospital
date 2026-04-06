import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, TitleCasePipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { HospitalService } from '../../services/hospital.service';

@Component({
  selector: 'app-icu',
  imports: [NgClass, TitleCasePipe, DatePipe],
  templateUrl: './icu.component.html',
})
export class IcuComponent implements OnInit, OnDestroy {
  icuPatients: Patient[] = [];
  currentTime = new Date();
  readonly Math = Math;

  private sub!: Subscription;
  private timer!: ReturnType<typeof setInterval>;

  constructor(private svc: HospitalService) {}

  ngOnInit(): void {
    this.sub   = this.svc.patients$.subscribe(p => {
      this.icuPatients = p.filter(pt => pt.ward === 'ICU' || pt.status === 'critical');
    });
    this.timer = setInterval(() => (this.currentTime = new Date()), 1000);
  }

  hrStatus(hr: number): 'critical' | 'warning' | 'normal' {
    if (hr > 110 || hr < 45) return 'critical';
    if (hr > 95  || hr < 55) return 'warning';
    return 'normal';
  }

  spo2Status(v: number): 'critical' | 'warning' | 'normal' {
    if (v < 90) return 'critical';
    if (v < 95) return 'warning';
    return 'normal';
  }

  cardBorder(p: Patient): string {
    if (p.status === 'critical') return 'border-red-900/60 bg-red-950/10';
    if (p.status === 'warning')  return 'border-amber-900/50 bg-amber-950/10';
    return 'border-zinc-900';
  }

  statusDot(p: Patient): string {
    if (p.status === 'critical') return 'bg-red-500 animate-pulse';
    if (p.status === 'warning')  return 'bg-amber-400 animate-pulse';
    return 'bg-green-400';
  }

  timeSince(date: Date): string {
    const h = Math.floor((+new Date() - +date) / 3600000);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearInterval(this.timer);
  }
}
