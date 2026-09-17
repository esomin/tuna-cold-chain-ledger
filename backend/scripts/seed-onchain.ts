
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlockchainService } from '../src/blockchain/blockchain.service';
import { AuditLogsService } from '../src/audit-logs/audit-logs.service';
import { ethers } from 'ethers';

async function seedOnChain() {
  console.log('[Seed On-Chain] Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  const blockchainService = app.get(BlockchainService);
  const auditLogsService = app.get(AuditLogsService);

  const poNumber = 'PO-2026-SCENARIO-A';
  const sku = 'TUNA-BLUEFIN';
  const quantity = 100;

  const stages = [
    { key: 'HARVESTED', action: `CREATE_PO_HARVESTED:${poNumber}`, raw: `${poNumber}:${sku}:${quantity}:HARVESTED` },
    { key: 'PROCESSING', action: `UPDATE_PO_STATUS_PROCESSING:${poNumber}`, raw: `${poNumber}:PROCESSING:2026-09-14T14:00:00Z` },
    { key: 'IN_TRANSIT', action: `UPDATE_PO_STATUS_IN_TRANSIT:${poNumber}`, raw: `${poNumber}:IN_TRANSIT:2026-09-15T02:00:00Z` },
    { key: 'DELIVERED', action: `UPDATE_PO_STATUS_DELIVERED:${poNumber}`, raw: `${poNumber}:DELIVERED:2026-09-15T16:00:00Z` },
  ];

  const existingLogs = await auditLogsService.findAll();

  for (const st of stages) {
    const exists = existingLogs.some((l) => l.action === st.action || (l.action.includes(poNumber) && l.action.includes(st.key)));
    if (exists) {
      console.log(`[Seed On-Chain] Stage ${st.key} for ${poNumber} already logged. Skipping.`);
      continue;
    }

    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(st.raw));
    const checkpointId = st.key === 'HARVESTED' ? poNumber : `${poNumber}-${st.key}`;

    console.log(`[Seed On-Chain] Registering checkpoint ${checkpointId} (${st.key}) on-chain...`);
    let txHash = '0x' + 'f'.repeat(64);
    try {
      txHash = await blockchainService.registerCheckpoint(checkpointId, dataHash, st.key);
    } catch (e: any) {
      console.warn(`[Seed On-Chain] Web3 registerCheckpoint mock fallback for ${st.key}:`, e?.message || e);
    }

    await auditLogsService.logAction(st.action, dataHash, txHash);
    console.log(`[Seed On-Chain] Logged ${st.action} | dataHash: ${dataHash.slice(0, 16)}... | txHash: ${txHash.slice(0, 16)}...`);
  }

  console.log('[Seed On-Chain] On-chain scenario A seeding completed successfully!');
  await app.close();
  process.exit(0);
}

seedOnChain().catch((err) => {
  console.error('[Seed On-Chain Error]', err);
  process.exit(1);
});
