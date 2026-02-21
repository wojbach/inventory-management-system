import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { PricingService } from './services/pricing.service';
import { OrderDocument, OrderSchema } from './repositories/impl/order.schema';
import { ORDER_REPOSITORY_TOKEN } from './repositories/order-repository.interface';
import { MongoOrderRepository } from './repositories/impl/mongo-order.repository';
import { CreateOrderHandler } from './commands/handlers/create-order.handler';
import { GetOrdersHandler } from './queries/handlers/get-orders.handler';
import { InventoryModule } from '../inventory/inventory.module';
import { ConsumersModule } from '../consumers/consumers.module';
import { DISCOUNT_STRATEGIES_TOKEN } from './services/strategies/discount-strategy.interface';
import { VolumeDiscountStrategy } from './services/strategies/impl/volume-discount.strategy';
import { BlackFridayDiscountStrategy } from './services/strategies/impl/black-friday-discount.strategy';
import { HolidayDiscountStrategy } from './services/strategies/impl/holiday-discount.strategy';

@Module({
  imports: [CqrsModule, InventoryModule, ConsumersModule, MongooseModule.forFeature([{ name: OrderDocument.name, schema: OrderSchema }])],
  controllers: [OrdersController],
  providers: [
    VolumeDiscountStrategy,
    BlackFridayDiscountStrategy,
    HolidayDiscountStrategy,
    {
      provide: DISCOUNT_STRATEGIES_TOKEN,
      useFactory: (volume: VolumeDiscountStrategy, blackFriday: BlackFridayDiscountStrategy, holiday: HolidayDiscountStrategy) => [
        volume,
        blackFriday,
        holiday,
      ],
      inject: [VolumeDiscountStrategy, BlackFridayDiscountStrategy, HolidayDiscountStrategy],
    },
    PricingService,
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: MongoOrderRepository,
    },
    CreateOrderHandler,
    GetOrdersHandler,
  ],
})
export class OrdersModule {}
