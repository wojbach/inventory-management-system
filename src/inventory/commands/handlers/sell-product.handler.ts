import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { SellProductCommand } from '../impl/sell-product.command';
import { IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { IUnitOfWork, UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';

@CommandHandler(SellProductCommand)
export class SellProductHandler implements ICommandHandler<SellProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SellProductCommand): Promise<void> {
    const { id, amount } = command;

    await this.uow.withTransaction(async () => {
      const product = this.publisher.mergeObjectContext(await this.productRepository.findById(id));

      product.sell(amount);
      await this.productRepository.updateStock(product.getId(), -amount);

      product.commit();
    });
  }
}
