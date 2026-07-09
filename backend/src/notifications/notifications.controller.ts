import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('test')
    async testNotification(@Body() body: { userId: string; message: string; type?: 'EMAIL' | 'SLACK' }) {
        return this.notificationsService.sendNotification(body.userId, body.message, body.type);
    }
}
