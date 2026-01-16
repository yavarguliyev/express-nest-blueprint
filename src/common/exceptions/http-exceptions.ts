import { HttpException } from '@common/exceptions/http-exception';
import { HttpExceptionOptions } from '@common/interfaces/common.interface';

export class BadRequestException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 400), 400, httpExceptionOptions);
  }
}

export class ForbiddenException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 403), 403, httpExceptionOptions);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 500), 500, httpExceptionOptions);
  }
}

export class NotFoundException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 404), 404, httpExceptionOptions);
  }
}

export class PaymentRequiredException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 402), 402, httpExceptionOptions);
  }
}

export class UnauthorizedException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 401), 401, httpExceptionOptions);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor (objectOrError?: string | Record<string, unknown>, descriptionOrOptions?: string | HttpExceptionOptions) {
    const { description, httpExceptionOptions } = HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(HttpException.createBody(objectOrError ?? ({} as Record<string, unknown>), description, 503), 503, httpExceptionOptions);
  }
}
