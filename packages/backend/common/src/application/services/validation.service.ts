import { plainToClass, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';

import { ValidationException } from '../../domain/exceptions/validation.exception';

export class ValidationService {
  private static readonly DEFAULT_OPTIONS = {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false
  };

  static async validateAndTransform<T extends object>(dtoClass: ClassConstructor<T>, plainObject: unknown): Promise<T> {
    const dto = plainToClass(dtoClass, plainObject);
    await this.performValidation(dto, this.DEFAULT_OPTIONS);
    return dto;
  }

  static async validateDto<T extends object>(dto: T): Promise<void> {
    await this.performValidation(dto, this.DEFAULT_OPTIONS);
  }

  static async validateQuery<T extends object>(dtoClass: ClassConstructor<T>, queryObject: unknown): Promise<T> {
    const dto = plainToClass(dtoClass, queryObject, { enableImplicitConversion: true });
    await this.performValidation(dto, { ...this.DEFAULT_OPTIONS, skipMissingProperties: true, forbidNonWhitelisted: false });
    return dto;
  }

  static transformResponse<T extends object>(dtoClass: ClassConstructor<T>, data: unknown): T {
    return plainToClass(dtoClass, data, { excludeExtraneousValues: true, enableImplicitConversion: true });
  }

  static transformResponseArray<T extends object>(dtoClass: ClassConstructor<T>, dataArray: unknown[]): T[] {
    return dataArray.map(item => this.transformResponse(dtoClass, item));
  }

  private static async performValidation(dto: object, options: object): Promise<void> {
    const errors = await validate(dto, options);
    if (errors.length > 0) throw new ValidationException(errors);
  }
}
