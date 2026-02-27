import { AggregateRoot } from '@nestjs/cqrs';
import { ProductCreatedEvent } from '../events/impl/product-created.event';
import { ProductRestockedEvent } from '../events/impl/product-restocked.event';
import { ProductSoldEvent } from '../events/impl/product-sold.event';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { InvalidProductPriceException, InvalidStockAmountException } from '../exceptions/product-domain.exceptions';
import { ProductCategory } from '../enums/product-category.enum';

export class Product extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _price: number,
    private _stock: number,
    private readonly _category: ProductCategory,
  ) {
    super();
  }

  static create(id: string, name: string, description: string, price: number, stock: number, category: ProductCategory): Product {
    if (price <= 0) throw new InvalidProductPriceException('Price must be positive');
    if (price > 1_000_000) throw new InvalidProductPriceException('Price cannot exceed 1,000,000');
    if (stock > 1_000_000) throw new InvalidStockAmountException('Stock cannot exceed 1,000,000');
    const product = new Product(id, name, description, price, stock, category);
    product.apply(new ProductCreatedEvent(id, name, description, price, stock, category));
    return product;
  }

  restock(amount: number): void {
    if (amount <= 0) throw new InvalidStockAmountException('Restock amount must be positive');
    if (this._stock + amount > 1_000_000) {
      throw new InvalidStockAmountException('Stock cannot exceed 1,000,000');
    }
    this._stock += amount;
    this.apply(new ProductRestockedEvent(this._id, amount));
  }

  sell(amount: number): void {
    if (amount <= 0) throw new InvalidStockAmountException('Sell amount must be positive');
    if (this._stock < amount) {
      throw new InsufficientStockException(this._id, this._stock, amount);
    }
    this._stock -= amount;
    this.apply(new ProductSoldEvent(this._id, amount));
  }

  static load(id: string, name: string, description: string, price: number, stock: number, category: ProductCategory): Product {
    return new Product(id, name, description, price, stock, category);
  }

  // Pure Getters
  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getDescription(): string {
    return this._description;
  }

  getPrice(): number {
    return this._price;
  }

  getStock(): number {
    return this._stock;
  }

  getCategory(): ProductCategory {
    return this._category;
  }
}
