import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { ConsumerNotFoundException } from '../exceptions/consumer-not-found.exception';

@Catch(InsufficientStockException, ProductNotFoundException, ConsumerNotFoundException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof ProductNotFoundException || exception instanceof ConsumerNotFoundException ? 404 : 409;

    this.logger.error(exception.message, exception.stack);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
