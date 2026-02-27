import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

export class InvalidProductPriceException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Invalid product price') {
    super(message);
  }
}

export class InvalidStockAmountException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string = 'Invalid stock amount') {
    super(message);
  }
}
