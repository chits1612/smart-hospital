'use strict';

// ─── In-memory data store ─────────────────────────────────────────────────────
// All data lives here. The simulator mutates it; routes read it.

const patients = [
  { id: 'P001', name: 'James Wilson',     age: 67, ward: 'ICU',         heartRate: 102, bloodPressure: '145/95',  spo2: 94, temperature: 38.7, status: 'critical',  admittedAt: '2026-04-05T08:00:00.000Z' },
  { id: 'P002', name: 'Sarah Mitchell',   age: 45, ward: 'Cardiology',  heartRate: 78,  bloodPressure: '122/80',  spo2: 98, temperature: 37.1, status: 'stable',    admittedAt: '2026-04-04T11:30:00.000Z' },
  { id: 'P003', name: 'Robert Chen',      age: 53, ward: 'ICU',         heartRate: 118, bloodPressure: '160/100', spo2: 91, temperature: 39.2, status: 'critical',  admittedAt: '2026-04-06T02:15:00.000Z' },
  { id: 'P004', name: 'Emily Rodriguez',  age: 29, ward: 'Neurology',   heartRate: 72,  bloodPressure: '118/76',  spo2: 99, temperature: 36.8, status: 'stable',    admittedAt: '2026-04-03T14:00:00.000Z' },
  { id: 'P005', name: 'Michael Thompson', age: 71, ward: 'Orthopedics', heartRate: 88,  bloodPressure: '135/88',  spo2: 96, temperature: 37.5, status: 'warning',   admittedAt: '2026-04-02T09:45:00.000Z' },
  { id: 'P006', name: 'Linda Park',       age: 61, ward: 'ICU',         heartRate: 95,  bloodPressure: '140/92',  spo2: 93, temperature: 38.3, status: 'warning',   admittedAt: '2026-04-06T06:30:00.000Z' },
  { id: 'P007', name: 'David Kumar',      age: 38, ward: 'General',     heartRate: 74,  bloodPressure: '120/78',  spo2: 98, temperature: 37.0, status: 'stable',    admittedAt: '2026-04-01T16:20:00.000Z' },
  { id: 'P008', name: 'Anna Fischer',     age: 55, ward: 'Cardiology',  heartRate: 85,  bloodPressure: '128/84',  spo2: 97, temperature: 37.2, status: 'stable',    admittedAt: '2026-04-04T13:10:00.000Z' },
  { id: 'P009', name: 'Thomas Nguyen',    age: 44, ward: 'Neurology',   heartRate: 76,  bloodPressure: '124/82',  spo2: 97, temperature: 37.3, status: 'stable',    admittedAt: '2026-04-05T10:00:00.000Z' },
  { id: 'P010', name: 'Patricia Santos',  age: 78, ward: 'General',     heartRate: 91,  bloodPressure: '138/89',  spo2: 95, temperature: 37.8, status: 'warning',   admittedAt: '2026-04-06T07:55:00.000Z' },
];

const occupancy = [
  { ward: 'ICU',         occupied: 42, total: 60  },
  { ward: 'Cardiology',  occupied: 28, total: 40  },
  { ward: 'Neurology',   occupied: 19, total: 30  },
  { ward: 'Orthopedics', occupied: 22, total: 35  },
  { ward: 'General',     occupied: 95, total: 120 },
];

const admissions = [
  { day: 'Mon', count: 18 },
  { day: 'Tue', count: 24 },
  { day: 'Wed', count: 21 },
  { day: 'Thu', count: 32 },
  { day: 'Fri', count: 28 },
  { day: 'Sat', count: 15 },
  { day: 'Sun', count: 12 },
];

const alerts = [
  { id: 'A001', timestamp: '2026-04-06T14:32:00.000Z', patientName: 'James Wilson',     patientId: 'P001', ward: 'ICU',         type: 'High Heart Rate',        message: 'Heart rate exceeded threshold — current: 102 bpm (limit: 100)',  severity: 'critical', acknowledged: false },
  { id: 'A002', timestamp: '2026-04-06T14:28:00.000Z', patientName: 'Robert Chen',      patientId: 'P003', ward: 'ICU',         type: 'Low SpO2',               message: 'Blood oxygen critically low — current: 91% (limit: 92%)',         severity: 'critical', acknowledged: false },
  { id: 'A003', timestamp: '2026-04-06T14:15:00.000Z', patientName: 'Michael Thompson', patientId: 'P005', ward: 'Orthopedics', type: 'Elevated Temperature',   message: 'Temperature above normal — current: 37.5°C (limit: 37.5°C)',     severity: 'warning',  acknowledged: false },
  { id: 'A004', timestamp: '2026-04-06T14:10:00.000Z', patientName: 'Linda Park',       patientId: 'P006', ward: 'ICU',         type: 'High Blood Pressure',    message: 'Systolic BP elevated — current: 140 mmHg (threshold: 135)',      severity: 'warning',  acknowledged: true  },
  { id: 'A005', timestamp: '2026-04-06T13:55:00.000Z', patientName: 'James Wilson',     patientId: 'P001', ward: 'ICU',         type: 'Medication Overdue',     message: 'Scheduled medication overdue by 15 minutes',                      severity: 'info',     acknowledged: true  },
  { id: 'A006', timestamp: '2026-04-06T13:40:00.000Z', patientName: 'Sarah Mitchell',   patientId: 'P002', ward: 'Cardiology',  type: 'Lab Results Ready',      message: 'New cardiac panel results available for review',                  severity: 'info',     acknowledged: true  },
  { id: 'A007', timestamp: '2026-04-06T13:20:00.000Z', patientName: 'Robert Chen',      patientId: 'P003', ward: 'ICU',         type: 'Critical Deterioration', message: 'Rapid deterioration of respiratory function detected',            severity: 'critical', acknowledged: true  },
  { id: 'A008', timestamp: '2026-04-06T12:57:00.000Z', patientName: 'Patricia Santos',  patientId: 'P010', ward: 'General',     type: 'Fall Risk Alert',        message: 'Patient attempted to leave bed unassisted',                       severity: 'warning',  acknowledged: true  },
];

// ── Derived stats ─────────────────────────────────────────────────────────────
function computeStats() {
  const critical  = patients.filter(p => p.status === 'critical').length;
  const avgHR     = Math.round(patients.reduce((s, p) => s + p.heartRate, 0) / patients.length);
  const icuRow    = occupancy.find(o => o.ward === 'ICU');
  return {
    totalPatients: 247,
    icuOccupied:   icuRow ? icuRow.occupied : 42,
    icuCapacity:   icuRow ? icuRow.total    : 60,
    criticalAlerts: critical,
    avgHeartRate:  avgHR,
    staffOnDuty:   84,
    bedsAvailable: 18,
  };
}

module.exports = { patients, occupancy, admissions, alerts, computeStats };
