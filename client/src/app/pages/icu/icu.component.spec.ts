import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { IcuComponent } from './icu.component';
import { HospitalService } from '../../services/hospital.service';
import { Patient } from '../../models/patient.model';

// ── Factory ───────────────────────────────────────────────────────────────────
const p = (overrides: Partial<Patient>): Patient => ({
  id: 'P000', name: 'Test Patient', age: 55, ward: 'ICU',
  heartRate: 85, bloodPressure: '130/85', spo2: 96,
  temperature: 37.2, status: 'stable', admittedAt: new Date('2026-04-05'),
  ...overrides,
});

const MOCK_PATIENTS: Patient[] = [
  p({ id: 'P001', ward: 'ICU',      status: 'critical', heartRate: 118, spo2: 91,  temperature: 39.2 }),
  p({ id: 'P002', ward: 'ICU',      status: 'warning',  heartRate: 95,  spo2: 93,  temperature: 38.3 }),
  p({ id: 'P003', ward: 'General',  status: 'stable',   heartRate: 72,  spo2: 98,  temperature: 37.0 }), // not in ICU
  p({ id: 'P004', ward: 'Neuro',    status: 'critical', heartRate: 55,  spo2: 89,  temperature: 38.0 }), // critical non-ICU → shown
];

class MockHospitalService {
  private subject = new BehaviorSubject<Patient[]>(MOCK_PATIENTS);
  patients$ = this.subject.asObservable();
  emit(patients: Patient[]) { this.subject.next(patients); }
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('IcuComponent', () => {
  let component: IcuComponent;
  let fixture: ComponentFixture<IcuComponent>;
  let mockSvc: MockHospitalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcuComponent],
      providers: [{ provide: HospitalService, useClass: MockHospitalService }],
    }).compileComponents();

    mockSvc   = TestBed.inject(HospitalService) as unknown as MockHospitalService;
    fixture   = TestBed.createComponent(IcuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  // ── Creation ────────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('currentTime is a Date on init', () => {
    expect(component.currentTime).toBeInstanceOf(Date);
  });

  it('exposes Math reference', () => {
    expect(component.Math).toBe(Math);
  });

  // ── Patient filtering ────────────────────────────────────────────────────
  it('shows ICU ward patients', () => {
    const ids = component.icuPatients.map(p => p.id);
    expect(ids).toContain('P001');
    expect(ids).toContain('P002');
  });

  it('shows critical non-ICU patients', () => {
    // P004 is ward=Neuro but status=critical — must appear
    const ids = component.icuPatients.map(p => p.id);
    expect(ids).toContain('P004');
  });

  it('excludes stable non-ICU patients', () => {
    const ids = component.icuPatients.map(p => p.id);
    expect(ids).not.toContain('P003');
  });

  it('updates when service emits new data', () => {
    mockSvc.emit([p({ id: 'P099', ward: 'ICU', status: 'critical' })]);
    expect(component.icuPatients.length).toBe(1);
    expect(component.icuPatients[0].id).toBe('P099');
  });

  // ── hrStatus() ────────────────────────────────────────────────────────────
  it('hrStatus: > 110 → critical', () => {
    expect(component.hrStatus(115)).toBe('critical');
  });

  it('hrStatus: < 45 → critical', () => {
    expect(component.hrStatus(40)).toBe('critical');
  });

  it('hrStatus: 96–110 → warning', () => {
    expect(component.hrStatus(100)).toBe('warning');
  });

  it('hrStatus: 56–94 → normal', () => {
    expect(component.hrStatus(75)).toBe('normal');
  });

  it('hrStatus: exactly 95 → normal (boundary is exclusive >95)', () => {
    expect(component.hrStatus(95)).toBe('normal');
  });

  it('hrStatus: exactly 55 → normal (boundary is exclusive <55)', () => {
    expect(component.hrStatus(55)).toBe('normal');
  });

  // ── spo2Status() ─────────────────────────────────────────────────────────
  it('spo2Status: < 90 → critical', () => {
    expect(component.spo2Status(88)).toBe('critical');
  });

  it('spo2Status: 90–94 → warning', () => {
    expect(component.spo2Status(92)).toBe('warning');
  });

  it('spo2Status: >= 95 → normal', () => {
    expect(component.spo2Status(97)).toBe('normal');
  });

  it('spo2Status: exactly 90 → warning', () => {
    expect(component.spo2Status(90)).toBe('warning');
  });

  // ── cardBorder() ─────────────────────────────────────────────────────────
  it('cardBorder: critical patient → red border', () => {
    const result = component.cardBorder(p({ status: 'critical' }));
    expect(result).toContain('border-red-900');
  });

  it('cardBorder: warning patient → amber border', () => {
    const result = component.cardBorder(p({ status: 'warning' }));
    expect(result).toContain('border-amber-900');
  });

  it('cardBorder: stable patient → zinc border', () => {
    const result = component.cardBorder(p({ status: 'stable' }));
    expect(result).toContain('border-zinc-900');
  });

  // ── statusDot() ───────────────────────────────────────────────────────────
  it('statusDot: critical → red pulse', () => {
    expect(component.statusDot(p({ status: 'critical' }))).toContain('bg-red-500');
  });

  it('statusDot: warning → amber pulse', () => {
    expect(component.statusDot(p({ status: 'warning' }))).toContain('bg-amber-400');
  });

  it('statusDot: stable → green', () => {
    expect(component.statusDot(p({ status: 'stable' }))).toContain('bg-green-400');
  });

  // ── timeSince() ───────────────────────────────────────────────────────────
  it('timeSince returns hours for same-day admission', () => {
    const recent = new Date(Date.now() - 3 * 3600 * 1000); // 3 hours ago
    expect(component.timeSince(recent)).toBe('3h ago');
  });

  it('timeSince returns days for older admission', () => {
    const old = new Date(Date.now() - 50 * 3600 * 1000); // ~2 days ago
    expect(component.timeSince(old)).toBe('2d ago');
  });

  // ── Timer ────────────────────────────────────────────────────────────────
  it('updates currentTime every second', fakeAsync(() => {
    // Component must be created INSIDE fakeAsync so setInterval registers as a fake timer
    const localFixture = TestBed.createComponent(IcuComponent);
    const localComponent = localFixture.componentInstance;
    localFixture.detectChanges();
    const before = localComponent.currentTime;
    tick(1001);
    expect(localComponent.currentTime).not.toBe(before);
    discardPeriodicTasks();
  }));

  // ── Template ─────────────────────────────────────────────────────────────
  it('renders the ICU Monitor heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('ICU Monitor');
  });

  it('ngOnDestroy clears timer without throwing', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
