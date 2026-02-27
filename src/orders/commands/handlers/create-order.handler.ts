import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../impl/create-order.command';
import { CONSUMER_REPOSITORY_TOKEN, IConsumerRepository } from '../../../consumers/repositories/consumer-repository.interface';
import { ConsumerNotFoundException } from '../../../common/exceptions/consumer-not-found.exception';
import { ORDER_REPOSITORY_TOKEN, IOrderRepository } from '../../repositories/order-repository.interface';
import { PricingService } from '../../services/pricing.service';
import { PricingItem, PricingResult } from '../../services/pricing.types';
import { IUnitOfWork, UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';
import { InventoryFacade, ProductSnapshot } from '../../../inventory/inventory.facade';
import { Order } from '../../models/order.aggregate';
import { Money } from '../../models/value-objects/money.value-object';
import { OrderItem } from '../../models/value-objects/order-item.value-object';
import * as crypto from 'crypto';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    @Inject(CONSUMER_REPOSITORY_TOKEN)
    private readonly consumerRepository: IConsumerRepository,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
    private readonly pricingService: PricingService,
    private readonly publisher: EventPublisher,
    private readonly inventoryFacade: InventoryFacade,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const { customerId, items } = command;
    const orderId = crypto.randomUUID();

    const consumerLocation = await this.validateCustomerLocation(customerId);

    return this.uow.withTransaction(async () => {
      const snapshots = await this.getProductSnapshots(items);

      const pricingItems: PricingItem[] = snapshots.map(({ snapshot, quantity }) => ({
        productId: snapshot.id,
        price: snapshot.price,
        quantity,
        category: snapshot.category,
      }));

      const pricingDetails: PricingResult = this.pricingService.calculate(pricingItems, consumerLocation);

      await this.deductStockForAll(items);

      // Create Value Objects for OrderItems
      const orderItems = pricingItems.map((pi) => OrderItem.create(pi.productId, pi.quantity, Money.create(pi.price)));

      const orderAggregate = this.publisher.mergeObjectContext(
        Order.create(
          orderId,
          customerId,
          orderItems,
          Money.create(pricingDetails.total),
          Money.create(pricingDetails.originalTotal),
          Money.create(pricingDetails.regionalAdjustment),
          Money.create(pricingDetails.taxAmount),
          pricingDetails.taxRate,
          pricingDetails.discountApplied,
        ),
      );

      await this.orderRepository.create(orderAggregate);
      orderAggregate.commit();

      return orderId;
    });
  }

  private async validateCustomerLocation(customerId: string) {
    const consumer = await this.consumerRepository.findById(customerId);
    if (!consumer) {
      throw new ConsumerNotFoundException(customerId);
    }
    return consumer.location;
  }

  private async getProductSnapshots(items: { productId: string; quantity: number }[]) {
    const snapshots: { snapshot: ProductSnapshot; quantity: number }[] = [];
    for (const item of items) {
      const snapshot = await this.inventoryFacade.getProductSnapshot(item.productId);
      snapshots.push({ snapshot, quantity: item.quantity });
    }
    return snapshots;
  }

  private async deductStockForAll(items: { productId: string; quantity: number }[]) {
    for (const { productId, quantity } of items) {
      await this.inventoryFacade.deductStock(productId, quantity);
    }
  }
}
