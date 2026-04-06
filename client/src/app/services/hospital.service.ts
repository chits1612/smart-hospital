import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { Patient, HospitalStats, BedOccupancy, DailyAdmission } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private patients: Patient[] = [
    { id: 'P001', name: 'James Wilson',      age: 67, ward: 'ICU',          heartRate: 102, bloodPressure: '145/95', spo2: 94, temperature: 38.7, status: 'critical',   admittedAt: new Date('2026-04-05') },
    { id: 'P002', name: 'Sarah Mitchell',    age: 45, ward: 'Cardiology',   heartRate: 78,  bloodPressure: '122/80', spo2: 98, temperature: 37.1, status: 'stable',      admittedAt: new Date('2026-04-04') },
    { id: 'P003', name: 'Robert Chen',       age: 53, ward: 'ICU',          heartRate: 118, bloodPressure: '160/100',spo2: 91, temperature: 39.2, status: 'critical',   admittedAt: new Date('2026-04-06') },
    { id: 'P004', name: 'Emily Rodriguez',   age: 29, ward: 'Neurology',    heartRate: 72,  bloodPressure: '118/76', spo2: 99, temperature: 36.8, status: 'stable',      admittedAt: new Date('2026-04-03') },
    { id: 'P005', name: 'Michael Thompson',  age: 71, ward: 'Orthopedics',  heartRate: 88,  bloodPressure: '135/88', spo2: 96, temperature: 37.5, status: 'warning',     admittedAt: new Date('2026-04-02') },
    { id: 'P006', name: 'Linda Park',        age: 61, ward: 'ICU',          heartRate: 95,  bloodPressure: '140/92', spo2: 93, temperature: 38.3, status: 'warning',     admittedAt: new Date('2026-04-06') },
    { id: 'P007', name: 'David Kumar',       age: 38, ward: 'General',      heartRate: 74,  bloodPressure: '120/78', spo2: 98, temperature: 37.0, status: 'stable',      admittedAt: new Date('2026-04-01') },
    { id: 'P008', name: 'Anna Fischer',      age: 55, ward: 'Cardiology',   heartRate: 85,  bloodPressure: '128/84', spo2: 97, temperature: 37.2, status: 'stable',      admittedAt: new Date('2026-04-04') },
    { id: 'P009', name: 'Thomas Nguyen',     age: 44, ward: 'Neurology',    heartRate: 76,  bloodPressure: '124/82', spo2: 97, temperature: 37.3, status: 'stable',      admittedAt: new Date('2026-04-05') },
    { id: 'P010', name: 'Patricia Santos',   age: 78, ward: 'General',      heartRate: 91,  bloodPressure: '138/89', spo2: 95, temperature: 37.8, status: 'warning',     admittedAt: new Date('2026-04-06') },
  ];

  private patientsSubject = new BehaviorSubject<Patient[]>(this.patients);
  patients$ = this.patientsSubject.asObservable();

  private ecgHistory: number[] = this.generateInitialEcg(60);
  private ecgSubject = new BehaviorSubject<number[]>([...this.ecgHistory]);
  ecg$ = this.ecgSubject.asObservable();

  private statsSubject = new BehaviorSubject<HospitalStats>(this.computeStats());
  stats$ = this.statsSubject.asObservable();

  private ecgTick = 0;

  constructor() {
    interval(400).subscribe(() => this.tickEcg());
    interval(3000).subscribe(() => this.updateVitals());
  }

  private generateInitialEcg(count: number): number[] {
    return Array.from({ length: count }, (_, i) => this.ecgValue(i));
  }

  private ecgValue(tick: number): number {
    const phase = ((tick % 25) + 25) % 25;
    if (phase === 9)  return 50;
    if (phase === 10) return 140;
    if (phase === 11) return 45;
    if (phase >= 13 && phase <= 17) return 70 + Math.sin((phase - 13) * Math.PI / 4) * 18;
    return 65 + (Math.random() - 0.5) * 2;
  }

  private tickEcg(): void {
    this.ecgTick++;
    this.ecgHistory.shift();
    this.ecgHistory.push(this.ecgValue(this.ecgTick));
    this.ecgSubject.next([...this.ecgHistory]);
  }

  private updateVitals(): void {
    this.patients = this.patients.map(p => ({
      ...p,
      heartRate: Math.max(45, Math.min(160, p.heartRate + Math.round((Math.random() - 0.5) * 5))),
      spo2: Math.max(88, Math.min(100, p.spo2 + Math.round((Math.random() - 0.5) * 2))),
    }));
    this.patientsSubject.next([...this.patients]);
    this.statsSubject.next(this.computeStats());
  }

  private computeStats(): HospitalStats {
    const critical = this.patients.filter(p => p.status === 'critical').length;
    const avgHR = Math.round(this.patients.reduce((s, p) => s + p.heartRate, 0) / this.patients.length);
    return {
      totalPatients: 247,
      icuOccupied: 42,
      icuCapacity: 60,
      criticalAlerts: critical,
      avgHeartRate: avgHR,
      staffOnDuty: 84,
      bedsAvailable: 18,
    };
  }

  getBedOccupancy(): BedOccupancy[] {
    return [
      { ward: 'ICU',          occupied: 42,  total: 60  },
      { ward: 'Cardiology',   occupied: 28,  total: 40  },
      { ward: 'Neurology',    occupied: 19,  total: 30  },
      { ward: 'Orthopedics',  occupied: 22,  total: 35  },
      { ward: 'General',      occupied: 95,  total: 120 },
    ];
  }

  getDailyAdmissions(): { day: string; count: number }[] {
    return [
      { day: 'Mon', count: 18 },
      { day: 'Tue', count: 24 },
      { day: 'Wed', count: 21 },
      { day: 'Thu', count: 32 },
      { day: 'Fri', count: 28 },
      { day: 'Sat', count: 15 },
      { day: 'Sun', count: 12 },
    ];
  }
}
