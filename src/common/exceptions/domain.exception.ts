import { HttpStatus } from '@nestjs/common';

export abstract class DomainException extends Error {
  abstract readonly httpStatus: HttpStatus;

  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
