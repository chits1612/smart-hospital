import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { AlertsComponent } from './alerts.component';
import { HospitalService } from '../../services/hospital.service';

// ── Factory ───────────────────────────────────────────────────────────────────
interface MockAlert {
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

const a = (overrides: Partial<MockAlert>): MockAlert => ({
  id: 'A000', timestamp: '2026-04-06T12:00:00.000Z',
  patientName: 'Test Patient', patientId: 'P001',
  ward: 'ICU', type: 'Test Alert', message: 'Test message',
  severity: 'info', acknowledged: false,
  ...overrides,
});

// Factory returns fresh object instances every call — prevents mutation bleed between tests
function makeMockAlerts(): MockAlert[] {
  return [
    a({ id: 'A001', severity: 'critical', acknowledged: false }),
    a({ id: 'A002', severity: 'warning',  acknowledged: false }),
    a({ id: 'A003', severity: 'info',     acknowledged: true  }),
    a({ id: 'A004', severity: 'critical', acknowledged: true  }),
    a({ id: 'A005', severity: 'warning',  acknowledged: false }),
  ];
}

class MockHospitalService {
  // Fresh instances per service creation — no shared mutable state
  private subject = new BehaviorSubject<any[]>(makeMockAlerts());
  alerts$ = this.subject.asObservable();
  acknowledgeAlert = jasmine.createSpy('acknowledgeAlert').and.callFake((id: string) =>
    of({ id, acknowledged: true }),
  );
  emit(alerts: any[]) { this.subject.next(alerts); }
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let mockSvc: MockHospitalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsComponent],
      providers: [{ provide: HospitalService, useClass: MockHospitalService }],
    }).compileComponents();

    mockSvc   = TestBed.inject(HospitalService) as unknown as MockHospitalService;
    fixture   = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  // ── Creation ────────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads alerts from service on init', () => {
    expect(component.alerts.length).toBe(5);
  });

  it('default filter is "all"', () => {
    expect(component.activeFilter).toBe('all');
  });

  // ── filtered getter ───────────────────────────────────────────────────────
  it('filtered returns all alerts by default', () => {
    expect(component.filtered.length).toBe(5);
  });

  it('filtered returns only critical alerts when filter is "critical"', () => {
    component.activeFilter = 'critical';
    expect(component.filtered.every(a => a.severity === 'critical')).toBeTrue();
    expect(component.filtered.length).toBe(2);
  });

  it('filtered returns only warning alerts when filter is "warning"', () => {
    component.activeFilter = 'warning';
    expect(component.filtered.length).toBe(2);
  });

  it('filtered returns only info alerts when filter is "info"', () => {
    component.activeFilter = 'info';
    expect(component.filtered.length).toBe(1);
  });

  it('filtered returns empty when no match', () => {
    mockSvc.emit([]);
    component.activeFilter = 'critical';
    expect(component.filtered.length).toBe(0);
  });

  // ── unread() ──────────────────────────────────────────────────────────────
  it('unread() counts all unacknowledged alerts', () => {
    // A001 critical unack, A002 warning unack, A005 warning unack = 3
    expect(component.unread()).toBe(3);
  });

  it('unread("critical") counts only unacknowledged critical', () => {
    expect(component.unread('critical')).toBe(1);
  });

  it('unread("warning") counts only unacknowledged warning', () => {
    expect(component.unread('warning')).toBe(2);
  });

  it('unread("info") counts only unacknowledged info', () => {
    expect(component.unread('info')).toBe(0);
  });

  it('unread returns 0 when all acknowledged', () => {
    mockSvc.emit(makeMockAlerts().map(a => ({ ...a, acknowledged: true })));
    expect(component.unread()).toBe(0);
  });

  // ── acknowledge() ─────────────────────────────────────────────────────────
  it('acknowledge() calls service PATCH endpoint', () => {
    const alert = component.alerts.find(a => a.id === 'A001')!;
    component.acknowledge(alert);
    expect(mockSvc.acknowledgeAlert).toHaveBeenCalledWith('A001');
  });

  it('acknowledge() updates alert.acknowledged to true', () => {
    const alert = component.alerts.find(a => a.id === 'A001')!;
    expect(alert.acknowledged).toBeFalse();
    component.acknowledge(alert);
    expect(alert.acknowledged).toBeTrue();
  });

  it('acknowledge() reduces unread count', () => {
    const before = component.unread();
    const alert = component.alerts.find(a => a.id === 'A002')!;
    component.acknowledge(alert);
    expect(component.unread()).toBe(before - 1);
  });

  // ── severityIcon() ────────────────────────────────────────────────────────
  it('severityIcon: critical → red classes', () => {
    expect(component.severityIcon('critical')).toContain('text-red-400');
  });

  it('severityIcon: warning → amber classes', () => {
    expect(component.severityIcon('warning')).toContain('text-amber-400');
  });

  it('severityIcon: info → blue classes', () => {
    expect(component.severityIcon('info')).toContain('text-blue-400');
  });

  it('severityIcon: unknown → zinc fallback', () => {
    expect(component.severityIcon('unknown')).toContain('text-zinc-400');
  });

  // ── rowClass() ────────────────────────────────────────────────────────────
  it('rowClass: acknowledged → opacity-60', () => {
    expect(component.rowClass(a({ acknowledged: true }))).toBe('opacity-60');
  });

  it('rowClass: unacknowledged critical → red bg', () => {
    expect(component.rowClass(a({ severity: 'critical', acknowledged: false }))).toContain('bg-red-950');
  });

  it('rowClass: unacknowledged warning → amber bg', () => {
    expect(component.rowClass(a({ severity: 'warning', acknowledged: false }))).toContain('bg-amber-950');
  });

  it('rowClass: unacknowledged info → empty string', () => {
    expect(component.rowClass(a({ severity: 'info', acknowledged: false }))).toBe('');
  });

  // ── Reactive updates ──────────────────────────────────────────────────────
  it('reacts to new alerts pushed via service', () => {
    const newAlerts = [a({ id: 'A099', severity: 'critical', acknowledged: false })];
    mockSvc.emit(newAlerts);
    expect(component.alerts.length).toBe(1);
    expect(component.alerts[0].id).toBe('A099');
  });

  // ── Template ─────────────────────────────────────────────────────────────
  it('renders Alerts heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Alerts');
  });

  it('ngOnDestroy does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
