import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrderCreatedEvent } from '../impl/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class OrderEventsHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderEventsHandler.name);

  handle(event: OrderCreatedEvent) {
    this.logger.log(
      `OrderCreatedEvent: Order ${event.id} created for customer ${event.customerId}. Total: ${event.total} (Original: ${event.originalTotal}, Tax: ${event.taxAmount} @ ${event.taxRate * 100}%, Discount: ${event.discountApplied})`,
    );
  }
}
