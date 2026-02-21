import { AggregateRoot } from '@nestjs/cqrs';
import { ProductCreatedEvent } from '../events/impl/product-created.event';
import { ProductRestockedEvent } from '../events/impl/product-restocked.event';
import { ProductSoldEvent } from '../events/impl/product-sold.event';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { ProductCategory } from '../enums/product-category.enum';

export class Product extends AggregateRoot {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public stock: number,
    public category: ProductCategory,
  ) {
    super();
  }

  static create(id: string, name: string, description: string, price: number, stock: number, category: ProductCategory): Product {
    if (price <= 0) throw new Error('Price must be positive');
    if (price > 1_000_000) throw new Error('Price cannot exceed 1,000,000');
    if (stock > 1_000_000) throw new Error('Stock cannot exceed 1,000,000');
    const product = new Product(id, name, description, price, stock, category);
    product.apply(new ProductCreatedEvent(id, name, description, price, stock, category));
    return product;
  }

  restock(amount: number): void {
    if (amount <= 0) throw new Error('Restock amount must be positive');
    if (this.stock + amount > 1_000_000) {
      throw new Error('Stock cannot exceed 1,000,000');
    }
    this.stock += amount;
    this.apply(new ProductRestockedEvent(this.id, amount));
  }

  sell(amount: number): void {
    if (this.stock < amount) {
      throw new InsufficientStockException(this.id, this.stock, amount);
    }
    this.stock -= amount;
    this.apply(new ProductSoldEvent(this.id, amount));
  }
}
