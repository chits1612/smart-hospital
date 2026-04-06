export interface Patient {
  id: string;
  name: string;
  age: number;
  ward: string;
  heartRate: number;
  bloodPressure: string;
  spo2: number;
  temperature: number;
  status: 'stable' | 'critical' | 'warning' | 'discharged';
  admittedAt: Date;
}

export interface HospitalStats {
  totalPatients: number;
  icuOccupied: number;
  icuCapacity: number;
  criticalAlerts: number;
  avgHeartRate: number;
  staffOnDuty: number;
  bedsAvailable: number;
}

export interface BedOccupancy {
  ward: string;
  occupied: number;
  total: number;
}

export interface DailyAdmission {
  day: string;
  count: number;
}
