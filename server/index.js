'use strict';

const http      = require('http');
const express   = require('express');
const cors      = require('cors');
const { WebSocketServer } = require('ws');

const apiRouter   = require('./routes/api');
const { nextEcgPoint, getEcgHistory, updateVitals } = require('./simulator');

const PORT = process.env.PORT || 3000;

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// ─── HTTP server (shared with WS) ────────────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket server ─────────────────────────────────────────────────────────
// Mounted at ws://localhost:3000/ws
const wss = new WebSocketServer({ server, path: '/ws' });

// Broadcast helper — send JSON to every connected client
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(msg);
    }
  }
}

wss.on('connection', (ws) => {
  // On new connection: immediately send current ECG history + initial data
  ws.send(JSON.stringify({ type: 'ecg_snapshot', data: getEcgHistory() }));

  ws.on('error', (err) => console.error('[WS] client error:', err.message));
});

// ─── Simulator loops ─────────────────────────────────────────────────────────

// ECG point every 400 ms
setInterval(() => {
  const point = nextEcgPoint();
  broadcast({ type: 'ecg_tick', data: point });
}, 400);

// Vitals + stats every 3 s
setInterval(() => {
  updateVitals(broadcast);
}, 3000);

// ─── Start ───────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[server] REST  → http://localhost:${PORT}/api`);
  console.log(`[server] WS    → ws://localhost:${PORT}/ws`);
});
