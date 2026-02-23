import { BulkOperationRequest, JwtPayload } from '@config/libs';

export type ValidateOperationsParams = Pick<BulkOperationRequest, 'operations'>;

export interface ProcessBulkOperationsParams extends ValidateOperationsParams {
  user: JwtPayload;
  wait?: boolean;
}

export type DetectConflictsParams = ValidateOperationsParams;
