import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { ProductDocument, ProductSchema } from './models/product.schema';
import { PRODUCT_REPOSITORY_TOKEN } from './repositories/product-repository.interface';
import { CreateProductHandler } from './commands/handlers/create-product.handler';
import { RestockProductHandler } from './commands/handlers/restock-product.handler';
import { SellProductHandler } from './commands/handlers/sell-product.handler';
import { GetProductsHandler } from './queries/handlers/get-products.handler';

import { MongoProductRepository } from './repositories/mongo-product.repository';

const CommandHandlers = [
  CreateProductHandler,
  RestockProductHandler,
  SellProductHandler,
];
const QueryHandlers = [GetProductsHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: ProductDocument.name, schema: ProductSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: MongoProductRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PRODUCT_REPOSITORY_TOKEN],
})
export class InventoryModule {}
