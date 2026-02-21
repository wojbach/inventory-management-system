import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ConsumersModule } from './consumers/consumers.module';
@Module({
  imports: [CommonModule, DatabaseModule, InventoryModule, OrdersModule, ConsumersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
