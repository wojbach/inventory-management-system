import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

export class ConsumerNotFoundException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(public readonly consumerId: string) {
    super(`Consumer with ID ${consumerId} not found`);
  }
}
