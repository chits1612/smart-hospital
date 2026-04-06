import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { HospitalService } from '../../services/hospital.service';
import { Patient, HospitalStats, BedOccupancy, DailyAdmission } from '../../models/patient.model';

// ── Stubs ─────────────────────────────────────────────────────────────────────
const MOCK_PATIENTS: Patient[] = [
  { id: 'P001', name: 'James Wilson',   age: 67, ward: 'ICU',        heartRate: 102, bloodPressure: '145/95', spo2: 94,  temperature: 38.7, status: 'critical', admittedAt: new Date('2026-04-05') },
  { id: 'P002', name: 'Sarah Mitchell', age: 45, ward: 'Cardiology', heartRate: 78,  bloodPressure: '122/80', spo2: 98,  temperature: 37.1, status: 'stable',   admittedAt: new Date('2026-04-04') },
  { id: 'P003', name: 'Robert Chen',    age: 53, ward: 'ICU',        heartRate: 60,  bloodPressure: '118/76', spo2: 99,  temperature: 36.8, status: 'stable',   admittedAt: new Date('2026-04-03') },
];

const MOCK_STATS: HospitalStats = {
  totalPatients: 247, icuOccupied: 42, icuCapacity: 60,
  criticalAlerts: 2, avgHeartRate: 80, staffOnDuty: 84, bedsAvailable: 18,
};

const MOCK_OCCUPANCY: BedOccupancy[] = [
  { ward: 'ICU', occupied: 42, total: 60 },
  { ward: 'General', occupied: 95, total: 120 },
];

const MOCK_ADMISSIONS: DailyAdmission[] = [
  { day: 'Mon', count: 18 }, { day: 'Tue', count: 24 },
];

class MockHospitalService {
  private patientsSubject = new BehaviorSubject<Patient[]>(MOCK_PATIENTS);
  private statsSubject    = new BehaviorSubject<HospitalStats | null>(MOCK_STATS);
  private ecgSubject      = new BehaviorSubject<number[]>(Array(60).fill(65));

  patients$ = this.patientsSubject.asObservable();
  stats$    = this.statsSubject.asObservable();
  ecg$      = this.ecgSubject.asObservable();

  getBedOccupancy  = jasmine.createSpy('getBedOccupancy').and.returnValue(of(MOCK_OCCUPANCY));
  getDailyAdmissions = jasmine.createSpy('getDailyAdmissions').and.returnValue(of(MOCK_ADMISSIONS));
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockSvc: MockHospitalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: HospitalService, useClass: MockHospitalService },
      ],
    }).compileComponents();

    mockSvc   = TestBed.inject(HospitalService) as unknown as MockHospitalService;
    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  // ── Creation ────────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose stats$ from service', (done) => {
    component.stats$.subscribe(s => {
      if (s) {
        expect(s.totalPatients).toBe(247);
        done();
      }
    });
  });

  it('should expose patients$ from service', (done) => {
    component.patients$.subscribe(patients => {
      expect(patients.length).toBe(3);
      done();
    });
  });

  it('should set today to a Date instance', () => {
    expect(component.today).toBeInstanceOf(Date);
  });

  // ── Chart API calls ──────────────────────────────────────────────────────
  it('calls getBedOccupancy() son init', () => {
    expect(mockSvc.getBedOccupancy).toHaveBeenCalled();
  });

  it('calls getDailyAdmissions() on init', () => {
    expect(mockSvc.getDailyAdmissions).toHaveBeenCalled();
  });

  // ── statusClass() ────────────────────────────────────────────────────────
  it('statusClass returns correct class for critical', () => {
    expect(component.statusClass('critical')).toContain('text-red-400');
  });

  it('statusClass returns correct class for warning', () => {
    expect(component.statusClass('warning')).toContain('text-amber-400');
  });

  it('statusClass returns correct class for stable', () => {
    expect(component.statusClass('stable')).toContain('text-green-400');
  });

  it('statusClass returns correct class for discharged', () => {
    expect(component.statusClass('discharged')).toContain('text-zinc-400');
  });

  it('statusClass returns fallback for unknown status', () => {
    expect(component.statusClass('unknown')).toContain('text-zinc-400');
  });

  // ── hrClass() ────────────────────────────────────────────────────────────
  it('hrClass returns red for heart rate > 100', () => {
    expect(component.hrClass(110)).toBe('text-red-400');
  });

  it('hrClass returns red for heart rate < 50', () => {
    expect(component.hrClass(40)).toBe('text-red-400');
  });

  it('hrClass returns amber for heart rate 91–100', () => {
    expect(component.hrClass(95)).toBe('text-amber-400');
  });

  it('hrClass returns white for normal heart rate', () => {
    expect(component.hrClass(75)).toBe('text-white');
  });

  it('hrClass returns white exactly at boundary 50', () => {
    expect(component.hrClass(50)).toBe('text-white');
  });

  it('hrClass returns white exactly at boundary 90', () => {
    expect(component.hrClass(90)).toBe('text-white');
  });

  // ── spo2Class() ───────────────────────────────────────────────────────────
  it('spo2Class returns red when SpO2 < 93', () => {
    expect(component.spo2Class(90)).toBe('text-red-400');
  });

  it('spo2Class returns amber for SpO2 93–95', () => {
    expect(component.spo2Class(94)).toBe('text-amber-400');
  });

  it('spo2Class returns white for SpO2 >= 96', () => {
    expect(component.spo2Class(98)).toBe('text-white');
  });

  it('spo2Class returns amber exactly at 93', () => {
    expect(component.spo2Class(93)).toBe('text-amber-400');
  });

  it('spo2Class returns white exactly at 96', () => {
    expect(component.spo2Class(96)).toBe('text-white');
  });

  // ── initials() ────────────────────────────────────────────────────────────
  it('initials returns first letter of each word', () => {
    expect(component.initials('James Wilson')).toBe('JW');
  });

  it('initials handles three-word name', () => {
    expect(component.initials('Mary Jo Smith')).toBe('MJS');
  });

  it('initials handles single-word name', () => {
    expect(component.initials('Admin')).toBe('A');
  });

  // ── Template rendering ────────────────────────────────────────────────────
  it('renders three canvas elements', () => {
    const canvases = fixture.nativeElement.querySelectorAll('canvas');
    expect(canvases.length).toBe(3);
  });

  it('renders the "Hospital Overview" heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Hospital Overview');
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────
  it('ngOnDestroy cleans up without throwing', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
