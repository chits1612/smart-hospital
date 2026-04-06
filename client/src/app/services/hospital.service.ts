import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient, HospitalStats, BedOccupancy, DailyAdmission } from '../models/patient.model';
import { environment } from '../../environments/environment';

interface WsMessage {
  type: 'ecg_snapshot' | 'ecg_tick' | 'vitals' | 'stats' | 'alert';
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class HospitalService implements OnDestroy {
  private http = inject(HttpClient);

  // ── Subjects updated by WebSocket ──────────────────────────────────────────
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  private statsSubject    = new BehaviorSubject<HospitalStats | null>(null);
  private ecgSubject      = new BehaviorSubject<number[]>([]);
  private alertsSubject   = new BehaviorSubject<any[]>([]);

  patients$ = this.patientsSubject.asObservable();
  stats$    = this.statsSubject.asObservable();
  ecg$      = this.ecgSubject.asObservable();
  alerts$   = this.alertsSubject.asObservable();

  private ws!: WebSocket;

  constructor() {
    this.bootstrap();
  }

  /** Fetch initial snapshot via REST, then open WebSocket for live updates */
  private bootstrap(): void {
    // Parallel initial REST loads
    this.http.get<Patient[]>(`${environment.apiUrl}/patients`).subscribe(p => this.patientsSubject.next(p));
    this.http.get<HospitalStats>(`${environment.apiUrl}/stats`).subscribe(s => this.statsSubject.next(s));
    this.http.get<any[]>(`${environment.apiUrl}/alerts`).subscribe(a => this.alertsSubject.next(a));

    this.connectWs();
  }

  private connectWs(): void {
    this.ws = new WebSocket(environment.wsUrl);

    this.ws.onopen = () => console.log('[WS] connected to', environment.wsUrl);

    this.ws.onmessage = (event: MessageEvent) => {
      const msg: WsMessage = JSON.parse(event.data as string);
      this.handleWsMessage(msg);
    };

    this.ws.onclose = () => {
      console.warn('[WS] disconnected — reconnecting in 3 s');
      setTimeout(() => this.connectWs(), 3000);
    };

    this.ws.onerror = (e) => console.error('[WS] error', e);
  }

  private handleWsMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'ecg_snapshot':
        this.ecgSubject.next(msg.data as number[]);
        break;

      case 'ecg_tick': {
        const current = this.ecgSubject.getValue();
        const next = [...current.slice(1), msg.data as number];
        this.ecgSubject.next(next);
        break;
      }

      case 'vitals':
        this.patientsSubject.next(msg.data as Patient[]);
        break;

      case 'stats':
        this.statsSubject.next(msg.data as HospitalStats);
        break;

      case 'alert': {
        const current = this.alertsSubject.getValue();
        this.alertsSubject.next([msg.data, ...current]);
        break;
      }
    }
  }

  // ── HTTP helpers called by components ─────────────────────────────────────

  getBedOccupancy(): Observable<BedOccupancy[]> {
    return this.http.get<BedOccupancy[]>(`${environment.apiUrl}/occupancy`);
  }

  getDailyAdmissions(): Observable<DailyAdmission[]> {
    return this.http.get<DailyAdmission[]>(`${environment.apiUrl}/admissions`);
  }

  acknowledgeAlert(id: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/alerts/${id}/acknowledge`, {});
  }

  ngOnDestroy(): void {
    if (this.ws) this.ws.close();
  }
}
