import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Patient } from '../../models/patient.model';
import { HospitalService } from '../../services/hospital.service';

@Component({
  selector: 'app-patients',
  imports: [NgClass, TitleCasePipe, FormsModule],
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit, OnDestroy {
  allPatients: Patient[] = [];
  filtered: Patient[] = [];
  searchQuery  = '';
  activeStatus = 'all';
  activeWard   = 'all';

  readonly statuses = ['all', 'critical', 'warning', 'stable'];
  readonly wards    = ['all', 'ICU', 'Cardiology', 'Neurology', 'Orthopedics', 'General'];

  private sub!: Subscription;

  constructor(private svc: HospitalService) {}

  ngOnInit(): void {
    this.sub = this.svc.patients$.subscribe(p => {
      this.allPatients = p;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.allPatients.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchStatus = this.activeStatus === 'all' || p.status === this.activeStatus;
      const matchWard   = this.activeWard   === 'all' || p.ward   === this.activeWard;
      return matchSearch && matchStatus && matchWard;
    });
  }

  setStatus(s: string): void { this.activeStatus = s; this.applyFilters(); }
  setWard(w: string):   void { this.activeWard   = w; this.applyFilters(); }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      critical:   'text-red-400 bg-red-400/10 border border-red-900/40',
      warning:    'text-amber-400 bg-amber-400/10 border border-amber-900/40',
      stable:     'text-green-400 bg-green-400/10 border border-green-900/40',
      discharged: 'text-zinc-400 bg-zinc-800 border border-zinc-700',
    };
    return map[status] ?? 'text-zinc-400 bg-zinc-800 border border-zinc-700';
  }

  hrClass(hr: number): string {
    return hr > 100 || hr < 50 ? 'text-red-400' : hr > 90 ? 'text-amber-400' : 'text-white';
  }

  spo2Class(v: number): string {
    return v < 93 ? 'text-red-400' : v < 96 ? 'text-amber-400' : 'text-white';
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
