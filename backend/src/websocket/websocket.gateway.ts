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

    @WebSocketServer()
    server: Server;

    constructor(private readonly poService: PurchaseOrdersService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * IoT 시뮬레이터가 전송하는 센서 데이터를 수신하여 처리합니다.
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
                    timestamp: new Date(),
                });
            }
        } catch (error) {
            this.logger.error('Error handling telemetry data', error);
        }
    }
}
