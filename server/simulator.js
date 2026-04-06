'use strict';

const { patients, alerts, computeStats } = require('./db');

// ─── ECG waveform generator ───────────────────────────────────────────────────
let _ecgTick = 0;

function ecgValue(tick) {
  const phase = ((tick % 25) + 25) % 25;
  if (phase === 9)  return 50;
  if (phase === 10) return 140;
  if (phase === 11) return 45;
  if (phase >= 13 && phase <= 17) return 70 + Math.sin((phase - 13) * Math.PI / 4) * 18;
  return 65 + (Math.random() - 0.5) * 2;
}

// Seed ECG history
const ecgHistory = Array.from({ length: 60 }, (_, i) => ecgValue(i));

function nextEcgPoint() {
  _ecgTick++;
  const point = ecgValue(_ecgTick);
  ecgHistory.shift();
  ecgHistory.push(point);
  return point;
}

function getEcgHistory() {
  return [...ecgHistory];
}

// ─── Compute derived patient status from vitals ───────────────────────────────
function deriveStatus(p) {
  if (p.heartRate > 110 || p.heartRate < 45 || p.spo2 < 90 || p.temperature > 39) return 'critical';
  if (p.heartRate > 95  || p.heartRate < 55 || p.spo2 < 94 || p.temperature > 38) return 'warning';
  return 'stable';
}

// ─── Vitals updater ───────────────────────────────────────────────────────────
// Mutates patients in-place (same reference that routes use) so every
// GET /api/patients reflects the latest values.
let _alertIdCounter = alerts.length + 1;

function updateVitals(broadcast) {
  for (const p of patients) {
    p.heartRate  = Math.max(45,  Math.min(160, p.heartRate  + Math.round((Math.random() - 0.5) * 5)));
    p.spo2       = Math.max(88,  Math.min(100, p.spo2       + Math.round((Math.random() - 0.5) * 2)));
    const prev   = p.status;
    p.status     = deriveStatus(p);

    // Auto-generate alert when patient newly becomes critical
    if (prev !== 'critical' && p.status === 'critical') {
      const alert = {
        id:          `A${String(++_alertIdCounter).padStart(3, '0')}`,
        timestamp:   new Date().toISOString(),
        patientName: p.name,
        patientId:   p.id,
        ward:        p.ward,
        type:        'Status Change — Critical',
        message:     `${p.name} vitals deteriorated: HR ${p.heartRate} bpm, SpO2 ${p.spo2}%`,
        severity:    'critical',
        acknowledged: false,
      };
      alerts.unshift(alert);
      if (broadcast) broadcast({ type: 'alert', data: alert });
    }
  }

  if (broadcast) {
    broadcast({ type: 'vitals', data: patients });
    broadcast({ type: 'stats',  data: computeStats() });
  }
}

module.exports = { nextEcgPoint, getEcgHistory, updateVitals };
