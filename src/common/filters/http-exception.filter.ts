import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
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

    response.status(status).json(responseBody);
  }
}
