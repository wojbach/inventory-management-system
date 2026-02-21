import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { ConsumerNotFoundException } from '../exceptions/consumer-not-found.exception';

@Catch(InsufficientStockException, ProductNotFoundException, ConsumerNotFoundException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof ProductNotFoundException || exception instanceof ConsumerNotFoundException ? 404 : 409;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
