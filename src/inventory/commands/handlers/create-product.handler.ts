import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from '../impl/create-product.command';
import {
  IProductRepository,
  PRODUCT_REPOSITORY_TOKEN,
} from '../../repositories/product-repository.interface';
import { Product } from '../../models/product.aggregate';
import * as crypto from 'crypto';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateProductCommand): Promise<string> {
    const { name, description, price, stock } = command;
    const id = crypto.randomUUID();

    const product = this.publisher.mergeObjectContext(
      Product.create(id, name, description, price, stock),
    );

    await this.productRepository.create(product);
    product.commit();
    return id;
  }
}
