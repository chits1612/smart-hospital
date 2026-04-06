import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { PatientsComponent } from './patients.component';
import { HospitalService } from '../../services/hospital.service';
import { Patient } from '../../models/patient.model';

// ── Factory ───────────────────────────────────────────────────────────────────
const p = (overrides: Partial<Patient>): Patient => ({
  id: 'P000', name: 'Test Person', age: 40, ward: 'General',
  heartRate: 75, bloodPressure: '120/80', spo2: 98,
  temperature: 37.0, status: 'stable', admittedAt: new Date(),
  ...overrides,
});

const MOCK_PATIENTS: Patient[] = [
  p({ id: 'P001', name: 'Alice Smith',   ward: 'ICU',        status: 'critical', heartRate: 115, spo2: 91 }),
  p({ id: 'P002', name: 'Bob Jones',     ward: 'General',    status: 'stable',   heartRate: 72,  spo2: 98 }),
  p({ id: 'P003', name: 'Carol White',   ward: 'Cardiology', status: 'warning',  heartRate: 95,  spo2: 94 }),
  p({ id: 'P004', name: 'David Brown',   ward: 'ICU',        status: 'critical', heartRate: 45,  spo2: 88 }),
];

class MockHospitalService {
  private subject = new BehaviorSubject<Patient[]>(MOCK_PATIENTS);
  patients$ = this.subject.asObservable();
  emit(patients: Patient[]) { this.subject.next(patients); }
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('PatientsComponent', () => {
  let component: PatientsComponent;
  let fixture: ComponentFixture<PatientsComponent>;
  let mockSvc: MockHospitalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientsComponent, FormsModule],
      providers: [{ provide: HospitalService, useClass: MockHospitalService }],
    }).compileComponents();

    mockSvc   = TestBed.inject(HospitalService) as unknown as MockHospitalService;
    fixture   = TestBed.createComponent(PatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  // ── Creation ────────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads all patients on init', () => {
    expect(component.allPatients.length).toBe(4);
    expect(component.filtered.length).toBe(4);
  });

  it('reacts to new patient data from service', () => {
    const newPatients = [p({ id: 'P099', name: 'Eve Lane', status: 'stable' })];
    mockSvc.emit(newPatients);
    expect(component.allPatients.length).toBe(1);
    expect(component.filtered.length).toBe(1);
  });

  // ── Search ───────────────────────────────────────────────────────────────
  it('filters by name (case-insensitive)', () => {
    component.searchQuery = 'alice';
    component.applyFilters();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].name).toBe('Alice Smith');
  });

  it('filters by patient ID', () => {
    component.searchQuery = 'P003';
    component.applyFilters();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].id).toBe('P003');
  });

  it('shows all patients when search is cleared', () => {
    component.searchQuery = 'alice';
    component.applyFilters();
    component.searchQuery = '';
    component.applyFilters();
    expect(component.filtered.length).toBe(4);
  });

  it('returns empty list when no match', () => {
    component.searchQuery = 'zzznomatch';
    component.applyFilters();
    expect(component.filtered.length).toBe(0);
  });

  // ── Status filter ─────────────────────────────────────────────────────────
  it('setStatus filters to critical patients', () => {
    component.setStatus('critical');
    expect(component.filtered.every(p => p.status === 'critical')).toBeTrue();
    expect(component.filtered.length).toBe(2);
  });

  it('setStatus filters to warning patients', () => {
    component.setStatus('warning');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].id).toBe('P003');
  });

  it('setStatus "all" shows all patients', () => {
    component.setStatus('critical');
    component.setStatus('all');
    expect(component.filtered.length).toBe(4);
  });

  // ── Ward filter ───────────────────────────────────────────────────────────
  it('setWard filters to ICU patients', () => {
    component.setWard('ICU');
    expect(component.filtered.every(p => p.ward === 'ICU')).toBeTrue();
    expect(component.filtered.length).toBe(2);
  });

  it('setWard "all" shows all patients', () => {
    component.setWard('Cardiology');
    component.setWard('all');
    expect(component.filtered.length).toBe(4);
  });

  // ── Combined filters ──────────────────────────────────────────────────────
  it('combines search + status filter', () => {
    component.searchQuery = 'Alice';
    component.setStatus('critical');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].id).toBe('P001');
  });

  it('combines ward + status filter', () => {
    component.setWard('ICU');
    component.setStatus('critical');
    expect(component.filtered.length).toBe(2);
  });

  // ── CSS helpers ───────────────────────────────────────────────────────────
  it('statusClass: critical → contains text-red-400', () => {
    expect(component.statusClass('critical')).toContain('text-red-400');
  });

  it('statusClass: warning → contains text-amber-400', () => {
    expect(component.statusClass('warning')).toContain('text-amber-400');
  });

  it('statusClass: stable → contains text-green-400', () => {
    expect(component.statusClass('stable')).toContain('text-green-400');
  });

  it('statusClass: unknown → fallback class', () => {
    expect(component.statusClass('unknown')).toContain('text-zinc-400');
  });

  it('hrClass: 115 bpm → text-red-400', () => {
    expect(component.hrClass(115)).toBe('text-red-400');
  });

  it('hrClass: 40 bpm → text-red-400', () => {
    expect(component.hrClass(40)).toBe('text-red-400');
  });

  it('hrClass: 95 bpm → text-amber-400', () => {
    expect(component.hrClass(95)).toBe('text-amber-400');
  });

  it('hrClass: 75 bpm → text-white', () => {
    expect(component.hrClass(75)).toBe('text-white');
  });

  it('spo2Class: 88% → text-red-400', () => {
    expect(component.spo2Class(88)).toBe('text-red-400');
  });

  it('spo2Class: 94% → text-amber-400', () => {
    expect(component.spo2Class(94)).toBe('text-amber-400');
  });

  it('spo2Class: 98% → text-white', () => {
    expect(component.spo2Class(98)).toBe('text-white');
  });

  it('initials: multi-word name', () => {
    expect(component.initials('Alice Smith')).toBe('AS');
  });

  // ── Filter constants ──────────────────────────────────────────────────────
  it('statuses array starts with "all"', () => {
    expect(component.statuses[0]).toBe('all');
  });

  it('wards array starts with "all"', () => {
    expect(component.wards[0]).toBe('all');
  });

  // ── Template ──────────────────────────────────────────────────────────────
  it('renders a table', () => {
    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
  });
});
