import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IProductRepository, PRODUCT_REPOSITORY_TOKEN } from './repositories/product-repository.interface';
import { IUnitOfWork, UNIT_OF_WORK_TOKEN } from '../database/unit-of-work.interface';
import { ProductCategory } from './enums/product-category.enum';

export interface ProductSnapshot {
  id: string;
  price: number;
  stock: number;
  category: ProductCategory;
}

@Injectable()
export class InventoryFacade {
  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: IUnitOfWork,
    private readonly publisher: EventPublisher,
  ) {}

  async getProductSnapshot(productId: string): Promise<ProductSnapshot> {
    const product = await this.productRepository.findById(productId);
    return {
      id: product.getId(),
      price: product.getPrice(),
      stock: product.getStock(),
      category: product.getCategory(),
    };
  }

  async deductStock(productId: string, quantity: number): Promise<void> {
    const product = this.publisher.mergeObjectContext(await this.productRepository.findById(productId));
    product.sell(quantity);
    await this.productRepository.updateStock(product.getId(), -quantity);
    product.commit();
  }
}
