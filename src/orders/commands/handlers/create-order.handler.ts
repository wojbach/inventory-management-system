import { Inject, ConflictException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
import { CreateOrderCommand } from '../impl/create-order.command';
import { CONSUMER_REPOSITORY_TOKEN, IConsumerRepository } from '../../../consumers/repositories/consumer-repository.interface';
import { ConsumerNotFoundException } from '../../../common/exceptions/consumer-not-found.exception';
import { PRODUCT_REPOSITORY_TOKEN, IProductRepository } from '../../../inventory/repositories/product-repository.interface';
import { ORDER_REPOSITORY_TOKEN, IOrderRepository } from '../../repositories/order-repository.interface';
import { PricingService } from '../../services/pricing.service';
import { InsufficientStockException } from '../../../common/exceptions/insufficient-stock.exception';
import { Product } from '../../../inventory/models/product.aggregate';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository<ClientSession>,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository<ClientSession>,
    @Inject(CONSUMER_REPOSITORY_TOKEN)
    private readonly consumerRepository: IConsumerRepository,
    private readonly pricingService: PricingService,
    private readonly publisher: EventPublisher,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const { customerId, items } = command;

    const consumer = await this.consumerRepository.findById(customerId);
    if (!consumer) {
      throw new ConsumerNotFoundException(customerId);
    }
    const customerLocation = consumer.location;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const productsToSell: { product: Product; quantity: number }[] = [];

      for (const item of items) {
        const product = await this.productRepository.findById(item.productId);
        if (product.stock < item.quantity) {
          throw new InsufficientStockException(item.productId, product.stock, item.quantity);
        }
        productsToSell.push({ product, quantity: item.quantity });
      }

      const pricingItems = productsToSell.map(({ product, quantity }) => ({
        productId: product.id,
        price: product.price,
        quantity,
        category: product.category,
      }));

      const { total, originalTotal, regionalAdjustment, taxAmount, taxRate, discountApplied } = this.pricingService.calculate(
        pricingItems,
        customerLocation,
      );

      for (const { product, quantity } of productsToSell) {
        product.sell(quantity);
        await this.productRepository.updateStock(product.id, -quantity, session);
      }

      const orderId = crypto.randomUUID();
      const orderAggregate = await this.orderRepository.create(
        orderId,
        customerId,
        pricingItems,
        total,
        originalTotal,
        regionalAdjustment,
        taxAmount,
        taxRate,
        discountApplied,
        session,
      );

      const mergedOrder = this.publisher.mergeObjectContext(orderAggregate);

      await session.commitTransaction();

      for (const { product } of productsToSell) {
        this.publisher.mergeObjectContext(product).commit();
      }
      mergedOrder.commit(); // Ensure OrderCreatedEvent fires

      return orderId;
    } catch (error) {
      await session.abortTransaction();
      if (error?.code === 112 || error?.hasErrorLabel?.('TransientTransactionError')) {
        throw new ConflictException('Concurrent order update detected, please try again.');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
}
