import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { ProductDocument, ProductSchema } from './repositories/impl/product.schema';
import { PRODUCT_REPOSITORY_TOKEN } from './repositories/product-repository.interface';
import { PRODUCT_READ_REPOSITORY_TOKEN } from './repositories/product-read-repository.interface';
import { CreateProductHandler } from './commands/handlers/create-product.handler';
import { RestockProductHandler } from './commands/handlers/restock-product.handler';
import { SellProductHandler } from './commands/handlers/sell-product.handler';
import { GetProductsHandler } from './queries/handlers/get-products.handler';
import { ProductEventsHandler } from './events/handlers/product-events.handler';
import { InventoryFacade } from './inventory.facade';

import { MongoProductRepository } from './repositories/impl/mongo-product.repository';
import { MongoProductReadRepository } from './repositories/impl/mongo-product-read.repository';

const CommandHandlers = [CreateProductHandler, RestockProductHandler, SellProductHandler];
const QueryHandlers = [GetProductsHandler];
const EventHandlers = [ProductEventsHandler];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: ProductDocument.name, schema: ProductSchema }]), DatabaseModule],
  controllers: [InventoryController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: MongoProductRepository,
    },
    {
      provide: PRODUCT_READ_REPOSITORY_TOKEN,
      useClass: MongoProductReadRepository,
    },
    InventoryFacade,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [PRODUCT_REPOSITORY_TOKEN, InventoryFacade],
})
export class InventoryModule {}
