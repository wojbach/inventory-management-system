import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [CommonModule, DatabaseModule, InventoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
