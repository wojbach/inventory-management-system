import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { RestockProductCommand } from '../impl/restock-product.command';
import {
  IProductRepository,
  PRODUCT_REPOSITORY_TOKEN,
} from '../../repositories/product-repository.interface';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@CommandHandler(RestockProductCommand)
export class RestockProductHandler implements ICommandHandler<RestockProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly publisher: EventPublisher,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async execute(command: RestockProductCommand): Promise<void> {
    const { id, amount } = command;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const product = this.publisher.mergeObjectContext(
        await this.productRepository.findById(id),
      );

      product.restock(amount);
      await this.productRepository.updateStock(
        product.id,
        product.stock,
        session,
      );

      await session.commitTransaction();
      product.commit();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
