import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';
import { AppConfigService } from '../common/config/app-config.service';
import { DatabaseService } from './database.service';
import { MongoUnitOfWork } from './mongo-unit-of-work';
import { UNIT_OF_WORK_TOKEN } from './unit-of-work.interface';

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
  providers: [
    DatabaseService,
    {
      provide: UNIT_OF_WORK_TOKEN,
      useClass: MongoUnitOfWork,
    },
  ],
  exports: [MongooseModule, UNIT_OF_WORK_TOKEN],
})
export class DatabaseModule {}
