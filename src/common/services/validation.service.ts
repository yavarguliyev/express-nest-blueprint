import { plainToClass, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';

import { ValidationException } from '@common/exceptions';

export class ValidationService {
  static async validateAndTransform<T extends object> (dtoClass: ClassConstructor<T>, plainObject: unknown): Promise<T> {
    const dto = plainToClass(dtoClass, plainObject);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false
    });

    if (errors.length > 0) throw new ValidationException(errors);
    return dto;
  }

  static async validateDto<T extends object> (dto: T): Promise<void> {
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false
    });

    if (errors.length > 0) throw new ValidationException(errors);
  }

  static async validateQuery<T extends object> (dtoClass: ClassConstructor<T>, queryObject: unknown): Promise<T> {
    const dto = plainToClass(dtoClass, queryObject, { enableImplicitConversion: true });
    const errors = await validate(dto, {
      whitelist: true,
      skipMissingProperties: true,
      skipNullProperties: false,
      skipUndefinedProperties: false
    });

    if (errors.length > 0) throw new ValidationException(errors);
    return dto;
  }

  static transformResponse<T extends object> (dtoClass: ClassConstructor<T>, data: unknown): T {
    return plainToClass(dtoClass, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }

  static transformResponseArray<T extends object> (dtoClass: ClassConstructor<T>, dataArray: unknown[]): T[] {
    return dataArray.map((item) => this.transformResponse(dtoClass, item));
  }
}
