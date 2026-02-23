import { BulkOperationResponse } from '../../domain/interfaces/database/bulk-operations.interface';

export const isBulkOperationResponse = (value: unknown): value is BulkOperationResponse => {
  if (!value || typeof value !== 'object') return false;
  return 'success' in value && 'results' in value && 'summary' in value;
};

export const sanitizeOperationData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitizedData = { ...data };

  if ('updated_at' in sanitizedData) delete sanitizedData['updated_at'];
  if ('updatedAt' in sanitizedData) delete sanitizedData['updatedAt'];
  if ('created_at' in sanitizedData) delete sanitizedData['created_at'];
  if ('createdAt' in sanitizedData) delete sanitizedData['createdAt'];

  return sanitizedData;
};
