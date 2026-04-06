import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patients/patients.component').then(m => m.PatientsComponent),
      },
      {
        path: 'icu',
        loadComponent: () =>
          import('./pages/icu/icu.component').then(m => m.IcuComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts/alerts.component').then(m => m.AlertsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
