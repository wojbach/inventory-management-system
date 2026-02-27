import { InvalidMoneyAmountException } from '../../exceptions/order-domain.exceptions';

export class Money {
  private constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new InvalidMoneyAmountException();
    }
    // we use a simple approach to manage precision, treating amount as cents or maintaining a fixed number of decimals
    this.amount = Math.round(amount * 100) / 100;
  }

  static create(amount: number): Money {
    return new Money(amount);
  }

  getAmount(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.getAmount());
  }

  subtract(other: Money): Money {
    const result = this.amount - other.getAmount();
    if (result < 0) {
      throw new InvalidMoneyAmountException('Subtraction resulted in negative money amount');
    }
    return new Money(result);
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new InvalidMoneyAmountException('Cannot multiply money by a negative number');
    }
    return new Money(this.amount * multiplier);
  }

  equals(other: Money): boolean {
    return this.amount === other.getAmount();
  }
}
