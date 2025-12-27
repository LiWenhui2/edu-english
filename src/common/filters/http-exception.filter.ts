import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    // 判断是否为 NestJS 的标准 HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (
          typeof resObj.message === 'string' ||
          Array.isArray(resObj.message)
        ) {
          message = resObj.message as string | string[];
        }
      } else {
        message = res;
      }
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    } else {
      const stack =
        exception instanceof Error ? exception.stack : 'No stack trace';
      const errorMsg =
        exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.error(
        `[${request.method}] ${request.url} - Status: ${status} - Error: ${errorMsg}`,
        stack, // 传入 stack 会在控制台打印漂亮的红色堆栈追踪
      );
      if (exception instanceof Error) {
      }
    }
    const finalMessage = Array.isArray(message) ? message[0] : message;
    response.status(status).json({
      status: status || 1,
      message: finalMessage,
    });
  }
}
