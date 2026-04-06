'use strict';

const express    = require('express');
const { patients, occupancy, admissions, alerts, computeStats } = require('../db');

const router = express.Router();

// GET /api/health — handshake / liveness check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET /api/patients
router.get('/patients', (_req, res) => {
  res.json(patients);
});

// GET /api/patients/:id
router.get('/patients/:id', (req, res) => {
  const p = patients.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json(p);
});

// GET /api/stats
router.get('/stats', (_req, res) => {
  res.json(computeStats());
});

// GET /api/occupancy
router.get('/occupancy', (_req, res) => {
  res.json(occupancy);
});

// GET /api/admissions
router.get('/admissions', (_req, res) => {
  res.json(admissions);
});

// GET /api/alerts
router.get('/alerts', (_req, res) => {
  res.json(alerts);
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/alerts/:id/acknowledge', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.acknowledged = true;
  res.json(alert);
});

module.exports = router;
