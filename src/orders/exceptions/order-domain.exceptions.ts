import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidOrderTotalException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Order total cannot be negative') {
    super(message);
  }
}

export class OrderMustContainAtLeastOneItemException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Order must contain at least one item') {
    super(message);
  }
}

export class InvalidMoneyAmountException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Money amount cannot be negative') {
    super(message);
  }
}

export class InvalidOrderQuantityException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Order item quantity must be greater than zero') {
    super(message);
  }
}
