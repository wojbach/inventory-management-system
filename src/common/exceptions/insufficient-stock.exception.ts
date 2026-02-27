import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class InsufficientStockException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(
    public readonly productId: string,
    public readonly currentStock: number,
    public readonly requestedAmount: number,
  ) {
    super(`Insufficient stock for product ${productId}. Available: ${currentStock}, Requested: ${requestedAmount}`);
  }
}
