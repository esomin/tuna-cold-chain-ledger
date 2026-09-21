const { NestFactory } = require('@nestjs/core');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Prefer compiled dist/ if available, fallback to src/
const hasDist = fs.existsSync(path.resolve(__dirname, '../dist/app.module.js'));
const moduleBase = hasDist ? '../dist' : '../src';

if (!hasDist) {
  require('ts-node').register();
}

const { AppModule } = require(path.resolve(__dirname, `${moduleBase}/app.module`));
const { BlockchainService } = require(path.resolve(__dirname, `${moduleBase}/blockchain/blockchain.service`));
const { AuditLogsService } = require(path.resolve(__dirname, `${moduleBase}/audit-logs/audit-logs.service`));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedOnChain() {
  console.log('[Seed On-Chain] Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  const blockchainService = app.get(BlockchainService);
  const auditLogsService = app.get(AuditLogsService);

  const scenarios = [
    {
      poNumber: 'PO-2026-SCENARIO-A',
      sku: 'TUNA-BLUEFIN',
      quantity: 100,
      name: '시나리오 A (골든 시나리오: 정상 완료)',
      stages: [
        { key: 'HARVESTED', rawTime: 'HARVESTED' },
        { key: 'PROCESSING', rawTime: '2026-09-14T14:00:00Z' },
        { key: 'IN_TRANSIT', rawTime: '2026-09-15T02:00:00Z' },
        { key: 'DELIVERED', rawTime: '2026-09-15T16:00:00Z' },
      ],
    },
    {
      poNumber: 'PO-2026-SCENARIO-B',
      sku: 'TUNA-BLUEFIN',
      quantity: 80,
      name: '시나리오 B (온도 이탈 4건 발생 시나리오)',
      stages: [
        { key: 'HARVESTED', rawTime: 'HARVESTED' },
        { key: 'PROCESSING', rawTime: '2026-09-14T15:00:00Z' },
        { key: 'IN_TRANSIT', rawTime: '2026-09-15T03:00:00Z' },
        { key: 'DELIVERED', rawTime: '2026-09-15T18:00:00Z' },
      ],
    },
  ];

  const existingLogs = await auditLogsService.findAll();

  for (const sc of scenarios) {
    console.log(`\n[Seed On-Chain] Processing ${sc.name} (${sc.poNumber})...`);

    for (const st of sc.stages) {
      const action =
        st.key === 'HARVESTED'
          ? `CREATE_PO_HARVESTED:${sc.poNumber}`
          : `UPDATE_PO_STATUS_${st.key}:${sc.poNumber}`;

      const exists = existingLogs.some(
        (l) => l.action === action || (l.action.includes(sc.poNumber) && l.action.includes(st.key)),
      );

      if (exists) {
        console.log(`[Seed On-Chain] Stage ${st.key} for ${sc.poNumber} already logged. Skipping.`);
        continue;
      }

      const raw =
        st.key === 'HARVESTED'
          ? `${sc.poNumber}:${sc.sku}:${sc.quantity}:HARVESTED`
          : `${sc.poNumber}:${st.key}:${st.rawTime}`;

      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(raw));
      const checkpointId = st.key === 'HARVESTED' ? sc.poNumber : `${sc.poNumber}-${st.key}`;

      console.log(`[Seed On-Chain] Registering checkpoint ${checkpointId} (${st.key}) on-chain...`);
      let txHash = '0x' + 'f'.repeat(64);
      try {
        txHash = await blockchainService.registerCheckpoint(checkpointId, dataHash, st.key);
      } catch (e) {
        console.warn(`[Seed On-Chain] Web3 registerCheckpoint mock fallback for ${st.key}:`, e?.message || e);
      }

      await auditLogsService.logAction(action, dataHash, txHash);
      console.log(
        `[Seed On-Chain] Logged ${action} | dataHash: ${dataHash.slice(0, 16)}... | txHash: ${txHash.slice(0, 16)}...`,
      );

      await sleep(200);
    }
  }

  console.log('\n[Seed On-Chain] All on-chain scenarios (A & B) seeded successfully!');
  await app.close();
  process.exit(0);
}

seedOnChain().catch((err) => {
  console.error('[Seed On-Chain Error]', err);
  process.exit(1);
});
