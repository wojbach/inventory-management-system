import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import { AppConfigService } from '../common/config/app-config.service';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [CommonModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        uri: appConfigService.mongoUri,
        timeoutMS: 5000,
        lazyConnection: true,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
