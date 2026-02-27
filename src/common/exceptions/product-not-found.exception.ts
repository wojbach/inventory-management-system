import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class ProductNotFoundException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(public readonly productId: string) {
    super(`Product with ID ${productId} not found`);
  }
}
