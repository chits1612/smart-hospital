import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HospitalService } from './hospital.service';
import { Patient, HospitalStats, BedOccupancy, DailyAdmission } from '../models/patient.model';

// ── helpers ──────────────────────────────────────────────────────────────────
const makePatient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'P001', name: 'Test Patient', age: 40, ward: 'ICU',
  heartRate: 80, bloodPressure: '120/80', spo2: 98,
  temperature: 37.0, status: 'stable',
  admittedAt: new Date('2026-04-01'),
  ...overrides,
});

const makeStats = (overrides: Partial<HospitalStats> = {}): HospitalStats => ({
  totalPatients: 100, icuOccupied: 10, icuCapacity: 20,
  criticalAlerts: 2, avgHeartRate: 78, staffOnDuty: 30, bedsAvailable: 5,
  ...overrides,
});

// ── Mock WebSocket ────────────────────────────────────────────────────────────
class MockWebSocket {
  static lastInstance: MockWebSocket;
  onopen:    ((e: Event) => void)        | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose:   ((e: CloseEvent) => void)   | null = null;
  onerror:   ((e: Event) => void)        | null = null;
  readyState = 1;

  constructor(public url: string) {
    MockWebSocket.lastInstance = this;
  }
  close() { this.readyState = 3; }

  /** Simulate server → client message */
  simulateMessage(payload: object) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('HospitalService', () => {
  let service: HospitalService;
  let http: HttpTestingController;

  beforeEach(() => {
    (window as any).WebSocket = MockWebSocket;

    TestBed.configureTestingModule({
      providers: [
        HospitalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(HospitalService);
    http    = TestBed.inject(HttpTestingController);

    // Flush bootstrap HTTP calls
    http.expectOne(r => r.url.includes('/patients')).flush([makePatient()]);
    http.expectOne(r => r.url.includes('/stats')).flush(makeStats());
    http.expectOne(r => r.url.includes('/alerts')).flush([]);
  });

  afterEach(() => {
    http.verify();
    service.ngOnDestroy();
  });

  // ── initial state ──────────────────────────────────────────────────────────
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('populates patients$ from REST bootstrap', (done) => {
    service.patients$.subscribe(patients => {
      expect(patients.length).toBe(1);
      expect(patients[0].name).toBe('Test Patient');
      done();
    });
  });

  it('populates stats$ from REST bootstrap', (done) => {
    service.stats$.subscribe(stats => {
      if (!stats) return;
      expect(stats.totalPatients).toBe(100);
      done();
    });
  });

  it('populates alerts$ from REST bootstrap', (done) => {
    service.alerts$.subscribe(alerts => {
      expect(Array.isArray(alerts)).toBeTrue();
      done();
    });
  });

  it('opens a WebSocket connection on bootstrap', () => {
    expect(MockWebSocket.lastInstance).toBeTruthy();
    expect(MockWebSocket.lastInstance.url).toContain('/ws');
  });

  // ── WebSocket message handling ─────────────────────────────────────────────
  it('handles ecg_snapshot message', (done) => {
    const snapshot = [65, 70, 140, 45, 65];
    MockWebSocket.lastInstance.simulateMessage({ type: 'ecg_snapshot', data: snapshot });

    service.ecg$.subscribe(ecg => {
      if (ecg.length > 0) {
        expect(ecg).toEqual(snapshot);
        done();
      }
    });
  });

  it('handles ecg_tick — appends to rolling window', (done) => {
    const snapshot = Array(60).fill(65);
    MockWebSocket.lastInstance.simulateMessage({ type: 'ecg_snapshot', data: snapshot });
    MockWebSocket.lastInstance.simulateMessage({ type: 'ecg_tick', data: 99 });

    service.ecg$.subscribe(ecg => {
      if (ecg.length === 60) {
        expect(ecg[ecg.length - 1]).toBe(99);
        expect(ecg.length).toBe(60);
        done();
      }
    });
  });

  it('handles vitals message — updates patients$', (done) => {
    const updated = [makePatient({ heartRate: 120, status: 'critical' })];
    MockWebSocket.lastInstance.simulateMessage({ type: 'vitals', data: updated });

    service.patients$.subscribe(p => {
      if (p[0]?.heartRate === 120) {
        expect(p[0].status).toBe('critical');
        done();
      }
    });
  });

  it('handles stats message — updates stats$', (done) => {
    const newStats = makeStats({ criticalAlerts: 5 });
    MockWebSocket.lastInstance.simulateMessage({ type: 'stats', data: newStats });

    service.stats$.subscribe(s => {
      if (s?.criticalAlerts === 5) {
        expect(s.criticalAlerts).toBe(5);
        done();
      }
    });
  });

  it('handles alert message — prepends to alerts$', (done) => {
    const alert = { id: 'A001', severity: 'critical', acknowledged: false };
    MockWebSocket.lastInstance.simulateMessage({ type: 'alert', data: alert });

    service.alerts$.subscribe(alerts => {
      if (alerts.length > 0) {
        expect(alerts[0].id).toBe('A001');
        done();
      }
    });
  });

  // ── HTTP helpers ───────────────────────────────────────────────────────────
  it('getBedOccupancy() calls correct endpoint', () => {
    const mockData: BedOccupancy[] = [{ ward: 'ICU', occupied: 10, total: 20 }];
    service.getBedOccupancy().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].ward).toBe('ICU');
    });
    const req = http.expectOne(r => r.url.includes('/occupancy'));
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('getDailyAdmissions() calls correct endpoint', () => {
    const mockData: DailyAdmission[] = [{ day: 'Mon', count: 18 }];
    service.getDailyAdmissions().subscribe(data => {
      expect(data[0].day).toBe('Mon');
      expect(data[0].count).toBe(18);
    });
    const req = http.expectOne(r => r.url.includes('/admissions'));
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('acknowledgeAlert() sends PATCH to correct endpoint', () => {
    service.acknowledgeAlert('A001').subscribe();
    const req = http.expectOne(r => r.url.includes('/alerts/A001/acknowledge'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'A001', acknowledged: true });
  });

  it('reconnects WebSocket after close', fakeAsync(() => {
    const originalInstance = MockWebSocket.lastInstance;
    originalInstance.onclose?.({} as CloseEvent);
    tick(3001);
    expect(MockWebSocket.lastInstance).not.toBe(originalInstance);
  }));
});
