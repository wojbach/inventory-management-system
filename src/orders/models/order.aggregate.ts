import { AggregateRoot } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '../events/impl/order-created.event';
import { Money } from './value-objects/money.value-object';
import { OrderItem } from './value-objects/order-item.value-object';
import { OrderMustContainAtLeastOneItemException } from '../exceptions/order-domain.exceptions';

export class Order extends AggregateRoot {
  private constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly items: OrderItem[],
    private readonly total: Money,
    private readonly originalTotal: Money,
    private readonly regionalAdjustment: Money,
    private readonly taxAmount: Money,
    private readonly taxRate: number,
    private readonly discountApplied: string,
  ) {
    super();
  }

  static create(
    id: string,
    customerId: string,
    items: OrderItem[],
    total: Money,
    originalTotal: Money,
    regionalAdjustment: Money,
    taxAmount: Money,
    taxRate: number,
    discountApplied: string,
  ): Order {
    if (items.length === 0) {
      throw new OrderMustContainAtLeastOneItemException();
    }
    // Money constructor already prevents negative amounts, so InvalidOrderTotalException is technically prevented,
    // but we can add further aggregate-level invariant checks here if needed in the future.

    const order = new Order(id, customerId, items, total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied);

    // DTO mapping for event to avoid leaking aggregate logic to event consumers
    order.apply(
      new OrderCreatedEvent(
        id,
        customerId,
        items.map((i) => ({ productId: i.getProductId(), quantity: i.getQuantity(), price: i.getPrice().getAmount() })),
        total.getAmount(),
        originalTotal.getAmount(),
        regionalAdjustment.getAmount(),
        taxAmount.getAmount(),
        taxRate,
        discountApplied,
      ),
    );
    return order;
  }

  static load(
    id: string,
    customerId: string,
    items: OrderItem[],
    total: Money,
    originalTotal: Money,
    regionalAdjustment: Money,
    taxAmount: Money,
    taxRate: number,
    discountApplied: string,
  ): Order {
    return new Order(id, customerId, items, total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied);
  }

  // Pure Getters - Data access for infra layer
  getId(): string {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getItems(): OrderItem[] {
    return this.items;
  }

  getTotal(): Money {
    return this.total;
  }

  getOriginalTotal(): Money {
    return this.originalTotal;
  }

  getRegionalAdjustment(): Money {
    return this.regionalAdjustment;
  }

  getTaxAmount(): Money {
    return this.taxAmount;
  }

  getTaxRate(): number {
    return this.taxRate;
  }

  getDiscountApplied(): string {
    return this.discountApplied;
  }
}
