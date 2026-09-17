import { io } from 'socket.io-client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const socket = io(BACKEND_URL);

console.log(`[IoT Simulator] Connecting to NestJS Gateway at ${BACKEND_URL}...`);

const ACTIVE_POS = [
  { poNumber: 'PO-2026-SCENARIO-A', baseTemp: -58.0, lat: 35.0784, lng: 129.0069 },
  { poNumber: 'PO-20260916-6842', baseTemp: -56.5, lat: 35.9892, lng: 129.5541 },
];

socket.on('connect', () => {
  console.log(`[IoT Simulator] Connected to WebSocket server with Client ID: ${socket.id}`);
  console.log(`[IoT Simulator] Starting 5-second automatic telemetry packet transmission...`);

  setInterval(() => {
    ACTIVE_POS.forEach((po) => {
      // Simulate slight temperature variation (-0.5°C to +0.5°C) and tiny GPS drift
      const tempFluctuation = Number((po.baseTemp + (Math.random() * 1.0 - 0.5)).toFixed(1));
      const latDrift = Number((po.lat + (Math.random() * 0.002 - 0.001)).toFixed(4));
      const lngDrift = Number((po.lng + (Math.random() * 0.002 - 0.001)).toFixed(4));

      const packet = {
        poNumber: po.poNumber,
        temperature: tempFluctuation,
        latitude: latDrift,
        longitude: lngDrift,
      };

      socket.emit('send_telemetry', packet);
      console.log(`[IoT Simulator 📡 -> Mongo] Telemetry Sent for ${po.poNumber}: ${tempFluctuation}°C | GPS: (${latDrift}, ${lngDrift})`);
    });
  }, 5000);
});

socket.on('disconnect', () => {
  console.warn('[IoT Simulator] Disconnected from WebSocket server.');
});

socket.on('connect_error', (err) => {
  console.error('[IoT Simulator Connection Error]', err.message);
});
