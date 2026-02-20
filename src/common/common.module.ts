import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config/app-config.service';
import { AppLoggerService } from './logger/app-logger.service';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
  providers: [AppConfigService, AppLoggerService],
  exports: [AppConfigService, AppLoggerService],
})
export class CommonModule {}
