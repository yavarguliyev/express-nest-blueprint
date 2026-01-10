import { ValidationError as ClassValidationError } from 'class-validator';

import { BadRequestException } from '@common/exceptions';

export class ValidationException extends BadRequestException {
  constructor (validationErrors: ClassValidationError[]) {
    const formattedErrors = ValidationException.formatValidationErrors(validationErrors);
    super({
      message: 'Validation failed',
      statusCode: 400,
      error: 'Bad Request',
      details: formattedErrors
    });
  }

  private static formatValidationErrors (errors: ClassValidationError[]): unknown[] {
    const formattedErrors: unknown[] = [];

    const processError = (error: ClassValidationError, parentPath = ''): void => {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        formattedErrors.push({
          property: fieldPath,
          value: error.value as unknown,
          constraints: error.constraints,
          messages: Object.values(error.constraints)
        });
      }

      if (error.children && error.children.length > 0) error.children.forEach((childError) => processError(childError, fieldPath));
    };

    errors.forEach((error) => processError(error));

    return formattedErrors;
  }
}
