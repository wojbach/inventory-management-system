import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    let rawMessage: unknown = exception.message;

    if (status === HttpStatus.BAD_REQUEST) {
      rawMessage = (exceptionResponse as { message: unknown }).message;
    }

    const responseBody: Record<string, unknown> = {
      statusCode: status,
      message: Array.isArray(rawMessage) ? rawMessage : [rawMessage],
      error: exception.name,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.warn(`[${status}] ${exception.message} ${JSON.stringify(rawMessage)}`);
    }

    response.status(status).json(responseBody);
  }
}
