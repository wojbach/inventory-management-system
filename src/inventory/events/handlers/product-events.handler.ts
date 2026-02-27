import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ProductCreatedEvent } from '../impl/product-created.event';
import { ProductRestockedEvent } from '../impl/product-restocked.event';
import { ProductSoldEvent } from '../impl/product-sold.event';

type ProductEvent = ProductCreatedEvent | ProductRestockedEvent | ProductSoldEvent;

@EventsHandler(ProductCreatedEvent, ProductRestockedEvent, ProductSoldEvent)
export class ProductEventsHandler implements IEventHandler<ProductEvent> {
  private readonly logger = new Logger(ProductEventsHandler.name);

  handle(event: ProductEvent) {
    if (event instanceof ProductCreatedEvent) {
      this.logger.log(`ProductCreatedEvent: Product ${event.id} created (${event.name}, stock: ${event.stock}, category: ${event.category})`);
    } else if (event instanceof ProductRestockedEvent) {
      this.logger.log(`ProductRestockedEvent: Product ${event.id} restocked with ${event.amount} items`);
    } else if (event instanceof ProductSoldEvent) {
      this.logger.log(`ProductSoldEvent: Product ${event.id} sold ${event.amount} items`);
    }
  }
}
