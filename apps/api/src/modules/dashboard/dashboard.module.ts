import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AppConfig } from '../../config/configuration';

@Module({
  imports: [ConfigModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService<AppConfig>) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Redis = require('ioredis');
        const redis = configService.get<AppConfig['redis']>('redis');
        const url = redis?.url ?? 'redis://localhost:6379';
        const client = new Redis(url, {
          lazyConnect: true,
          enableReadyCheck: false,
          maxRetriesPerRequest: 1,
        });
        client.on('error', () => {
          // Suppress unhandled error events; health check handles status
        });
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
