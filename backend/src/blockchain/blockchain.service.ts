import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class BlockchainService implements OnModuleInit {
    private readonly logger = new Logger(BlockchainService.name);
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        try {
            const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL') || 'http://127.0.0.1:8545';
            const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
            const privateKey = this.configService.get<string>('CONTRACT_PRIVATE_KEY');

            if (!contractAddress || !privateKey) {
                this.logger.warn('Blockchain variables are not fully set in .env. Web3 integration will run in mock mode.');
                return;
            }

            // 1. Provider 연결
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // 2. Signer 지갑 생성 및 프로바이더 연결
            this.wallet = new ethers.Wallet(privateKey, this.provider);

            // 3. ABI 로드
            const artifactPath = path.resolve(__dirname, '../../../artifacts/contracts/ColdChainTracker.sol/ColdChainTracker.json');
            if (!fs.existsSync(artifactPath)) {
                this.logger.error(`Hardhat artifact not found at ${artifactPath}. Please compile the contract first.`);
                return;
            }
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

            // 4. Contract 인스턴스화
            this.contract = new ethers.Contract(contractAddress, artifact.abi, this.wallet);
            this.logger.log(`Successfully connected to smart contract at ${contractAddress}`);
        } catch (error) {
            this.logger.error('Failed to initialize Ethers contract instance', error);
        }
    }

    /**
     * 블록체인에 유통 체크포인트를 등록하고 트랜잭션 해시를 반환합니다.
     */
    async registerCheckpoint(checkpointId: string, dataHash: string, stepName: string): Promise<string> {
        if (!this.contract) {
            this.logger.warn(`[Mock] Registering checkpoint ${checkpointId} (Hash: ${dataHash}, Step: ${stepName})`);
            return '0x' + 'f'.repeat(64); // mock tx hash
        }

        try {
            this.logger.log(`Registering checkpoint on-chain: ${checkpointId} for step: ${stepName}`);
            // 스마트 계약 트랜잭션 호출
            const tx = await this.contract.registerCheckpoint(checkpointId, dataHash, stepName);
            // 블록 마이닝 대기
            const receipt = await tx.wait();
            this.logger.log(`Checkpoint successfully registered in block ${receipt.blockNumber}`);
            return receipt.hash;
        } catch (error) {
            this.logger.error(`Failed to register checkpoint on-chain: ${checkpointId}`, error);
            throw new InternalServerErrorException('Blockchain transaction failed');
        }
    }

    /**
     * 블록체인으로부터 특정 체크포인트의 무결성 정보를 조회합니다.
     */
    async verifyCheckpoint(checkpointId: string): Promise<{ dataHash: string; timestamp: number; stepName: string }> {
        if (!this.contract) {
            this.logger.warn(`[Mock] Verifying checkpoint ${checkpointId}`);
            return {
                dataHash: '0x' + '0'.repeat(64),
                timestamp: Math.floor(Date.now() / 1000),
                stepName: 'Harvested (Mock)',
            };
        }

        try {
            const result = await this.contract.verifyCheckpoint(checkpointId);
            return {
                dataHash: result[0],
                timestamp: Number(result[1]),
                stepName: result[2],
            };
        } catch (error) {
            this.logger.error(`Failed to verify checkpoint from chain: ${checkpointId}`, error);
            throw new InternalServerErrorException('Blockchain read query failed');
        }
    }
}
