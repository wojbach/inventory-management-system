import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { RestockProductCommand } from '../impl/restock-product.command';
import { IProductRepository, PRODUCT_REPOSITORY_TOKEN } from '../../repositories/product-repository.interface';
import { IUnitOfWork, UNIT_OF_WORK_TOKEN } from '../../../database/unit-of-work.interface';

@CommandHandler(RestockProductCommand)
export class RestockProductHandler implements ICommandHandler<RestockProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RestockProductCommand): Promise<void> {
    const { id, amount } = command;

    await this.uow.withTransaction(async () => {
      const product = this.publisher.mergeObjectContext(await this.productRepository.findById(id));

      product.restock(amount);
      await this.productRepository.updateStock(product.getId(), amount);

      product.commit();
    });
  }
}
