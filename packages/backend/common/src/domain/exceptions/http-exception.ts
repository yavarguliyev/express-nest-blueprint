import { ExtractedDescriptionAndOptions, HttpExceptionOptions } from '../interfaces/nest/nest-core.interface';

export class HttpException extends Error {
  constructor (
    private readonly response: string | Record<string, unknown>,
    private readonly status: number,
    private readonly options?: { cause?: Error; description?: string }
  ) {
    super();
    this.initMessage();
    this.initName();
    this.initCause();
  }

  public initCause (): void {
    if (this.options?.cause) this.cause = this.options.cause;
  }

  public initMessage (): void {
    if (typeof this.response === 'string') this.message = this.response;
    else if (this.response && typeof this.response === 'object' && 'message' in this.response) {
      const responseMessage = this.response['message'];
      this.message = typeof responseMessage === 'string' ? responseMessage : 'Error';
    } else if (this.constructor) this.message = this.constructor.name.match(/[A-Z][a-z]+|[0-9]+/g)?.join(' ') ?? 'Error';
  }

  public initName (): void {
    this.name = this.constructor.name;
  }

  public getResponse (): string | object {
    return this.response;
  }

  public getStatus (): number {
    return this.status;
  }

  public static createBody (objectOrError?: string | Record<string, unknown>, description?: string, statusCode?: number): Record<string, unknown> {
    if (!objectOrError) return { statusCode, message: description ?? 'Error' } as Record<string, unknown>;
    if (typeof objectOrError === 'string') return { statusCode, message: objectOrError, error: description } as Record<string, unknown>;

    return objectOrError;
  }

  public static extractDescriptionAndOptionsFrom (descriptionOrOptions?: string | HttpExceptionOptions): ExtractedDescriptionAndOptions {
    if (typeof descriptionOrOptions === 'string') return { description: descriptionOrOptions };
    if (!descriptionOrOptions) return {};

    return {
      ...(descriptionOrOptions.description && { description: descriptionOrOptions.description }),
      httpExceptionOptions: descriptionOrOptions
    };
  }
}
