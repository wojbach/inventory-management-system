import { InvalidOrderQuantityException } from '../../exceptions/order-domain.exceptions';
import { Money } from './money.value-object';

export class OrderItem {
  private constructor(
    private readonly productId: string,
    private readonly quantity: number,
    private readonly price: Money,
  ) {
    if (quantity <= 0) {
      throw new InvalidOrderQuantityException();
    }
  }

  static create(productId: string, quantity: number, price: Money): OrderItem {
    return new OrderItem(productId, quantity, price);
  }

  getProductId(): string {
    return this.productId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getPrice(): Money {
    return this.price;
  }

  calculateTotal(): Money {
    return this.price.multiply(this.quantity);
  }
}
