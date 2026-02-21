import { AggregateRoot } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '../events/impl/order-created.event';

export class Order extends AggregateRoot {
  constructor(
    public readonly id: string,
    public customerId: string,
    public items: { productId: string; quantity: number; price: number }[],
    public total: number,
    public originalTotal: number,
    public regionalAdjustment: number,
    public taxAmount: number,
    public taxRate: number,
    public discountApplied: string,
  ) {
    super();
  }

  static create(
    id: string,
    customerId: string,
    items: { productId: string; quantity: number; price: number }[],
    total: number,
    originalTotal: number,
    regionalAdjustment: number,
    taxAmount: number,
    taxRate: number,
    discountApplied: string,
  ): Order {
    if (total < 0) throw new Error('Order total cannot be negative');
    if (originalTotal < 0) throw new Error('Order original total cannot be negative');
    if (items.length === 0) throw new Error('Order must contain at least one item');

    const order = new Order(id, customerId, items, total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied);
    order.apply(new OrderCreatedEvent(id, customerId, items, total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied));
    return order;
  }
}
