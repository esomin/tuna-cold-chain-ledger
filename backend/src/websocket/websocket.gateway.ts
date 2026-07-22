import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(WebsocketGateway.name);
    private autoStreamInterval: NodeJS.Timeout | null = null;
    private stepCount = 0;

    @WebSocketServer()
    server: Server;

    constructor(private readonly poService: PurchaseOrdersService) {
        this.startAutoStreamingEngine();
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * PO-2026-SCENARIO-C (라이브 운송건) 전용 자동 센서 스트리밍 엔진
     * 2.5초마다 파동 온도를 브로드캐스트하며, 15초마다(6번째 틱) -51.5°C 이탈 경고 패킷 발생
     */
    private startAutoStreamingEngine() {
        if (this.autoStreamInterval) return;

        this.autoStreamInterval = setInterval(async () => {
            if (!this.server) return;

            this.stepCount++;
            const targetPo = 'PO-2026-SCENARIO-C';

            // 30초에 한번씩(12번째 스텝) 온도 이탈 위험 파동 (-51.5°C) 발생, 평소에는 -58°C 근방 정상 사인파
            const isAnomalyStep = this.stepCount > 0 && this.stepCount % 12 === 0;
            const temperature = isAnomalyStep 
                ? Number((-51.5 + (Math.random() * 0.8)).toFixed(1))
                : Number((-58.0 + Math.sin(this.stepCount * 0.5) * 0.8).toFixed(1));

            // 경도/위도 미세 이동 시뮬레이션 (대전 -> 수도권 이동 경로)
            const latitude = 36.5 + (this.stepCount % 50) * 0.005;
            const longitude = 127.8 + (this.stepCount % 50) * 0.003;

            try {
                // MongoDB 적재
                await this.poService.recordSensorLog(targetPo, temperature, latitude, longitude);

                // 실시간 대시보드 브로드캐스트
                this.server.emit('live_telemetry', {
                    poNumber: targetPo,
                    temperature,
                    latitude,
                    longitude,
                    timestamp: new Date(),
                });

                // -55°C 임계치 초과 시 경고 이벤트 발송
                if (temperature > -55) {
                    const alertMsg = `⚠️ 경고: [${targetPo}] 참치 보관 온도 위험! 현재 온도 ${temperature}°C (기준 임계치: -55°C)`;
                    this.logger.warn(alertMsg);

                    this.server.emit('temperature_alert', {
                        poNumber: targetPo,
                        temperature,
                        message: alertMsg,
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (err) {
                // 무시 또는 로깅
            }
        }, 2500); // 2.5초 간격
    }

    /**
     * IoT 시뮬레이터 수동 패킷 수신 처리
     */
    @SubscribeMessage('send_telemetry')
    async handleTelemetry(@MessageBody() data: {
        poNumber: string;
        temperature: number;
        latitude: number;
        longitude: number;
    }) {
        try {
            const { poNumber, temperature, latitude, longitude } = data;

            // 1. MongoDB에 데이터 적재 (오프체인 적재)
            await this.poService.recordSensorLog(poNumber, temperature, latitude, longitude);

            // 2. 대시보드로 실시간 텔레메트리 정보 브로드캐스팅
            this.server.emit('live_telemetry', {
                poNumber,
                temperature,
                latitude,
                longitude,
                timestamp: new Date(),
            });

            // 3. 온도 이상 임계치 이탈 감지 경고 (-55°C 초과 시 위험 상황으로 규정)
            if (temperature > -55) {
                const alertMsg = `⚠️ 경고: [${poNumber}] 참치 보관 온도 위험! 현재 온도 ${temperature}°C (기준 임계치: -55°C)`;
                this.logger.warn(alertMsg);

                this.server.emit('temperature_alert', {
                    poNumber,
                    temperature,
                    message: alertMsg,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (error) {
            this.logger.error('Error handling telemetry data', error);
        }
    }
}
