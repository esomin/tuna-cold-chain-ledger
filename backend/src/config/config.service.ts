import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('port', 3000);
  }

  get dbHost(): string {
    return this.configService.get<string>('database.host', 'localhost');
  }

  get dbPort(): number {
    return this.configService.get<number>('database.port', 5432);
  }

  get dbUsername(): string {
    return this.configService.get<string>('database.username', 'postgres');
  }

  get dbPassword(): string {
    return this.configService.get<string>('database.password', 'postgres');
  }

  get dbName(): string {
    return this.configService.get<string>('database.name', 'coldchain_db');
  }
}
