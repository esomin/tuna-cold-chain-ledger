const { io } = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// CLI 인자 추출: npm run simulate -- <PO_NUMBER> [BASE_TEMP]
const poNumber = process.argv[2];
const baseTemp = process.argv[3] ? Number(process.argv[3]) : -57.5;

if (!poNumber) {
  console.log(`
===========================================================
 [IoT Simulator] 사용법 가이드 (Usage Guide)
===========================================================
 명령 형식을 확인하세요:
   npm run simulate -- <PO_NUMBER> [BASE_TEMP]

 예시 (Examples):
   npm run simulate -- PO-20260917-9615
   npm run simulate -- PO-20260917-9615 -55
===========================================================
  `);
  process.exit(1);
}

console.log(`[IoT Simulator] Connecting to NestJS Gateway at ${BACKEND_URL}...`);
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log(`\n[IoT Simulator] [OK] WebSocket 연결 성공 (Client ID: ${socket.id})`);
  console.log(`[IoT Simulator] [INFO] 대상 발주번호: [ ${poNumber} ] | 기준 온도: ${baseTemp}°C`);
  console.log(`[IoT Simulator] [RUNNING] 5초 간격 실시간 패킷 송신 시작... (종료: Ctrl+C)\n`);

  setInterval(() => {
    const tempFluctuation = Number((baseTemp + (Math.random() * 1.0 - 0.5)).toFixed(1));
    const latDrift = Number((35.0784 + (Math.random() * 0.002 - 0.001)).toFixed(4));
    const lngDrift = Number((129.0069 + (Math.random() * 0.002 - 0.001)).toFixed(4));

    const packet = {
      poNumber,
      temperature: tempFluctuation,
      latitude: latDrift,
      longitude: lngDrift,
    };

    socket.emit('send_telemetry', packet);
    console.log(`[IoT -> Mongo/WS] ${poNumber} | 온도: ${tempFluctuation}°C | GPS: (${latDrift}, ${lngDrift})`);
  }, 5000);
});

socket.on('disconnect', () => {
  console.warn('[IoT Simula stor] Disconnected from WebSocket server.');
});

socket.on('connect_error', (err: any) => {
  console.error('[IoT Simulator Connection Error]', err?.message || err);
});
