import { BULK_OPERATION_TYPES } from '../constants/api.constants';

export type BulkOperationType = (typeof BULK_OPERATION_TYPES)[keyof typeof BULK_OPERATION_TYPES];

export type BulkOperationTypes = 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'bulk_mixed';

export type BulkOperationStatusType = 'pending' | 'processing' | 'completed' | 'failed';

export type ResponseType = 'modified' | 'created' | 'deleted';
