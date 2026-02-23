import { Job } from 'bullmq';
import { CrudOperationLogType, CrudRepository, CrudTableOptions, JwtPayload } from '@config/libs';

export interface OperationCommon<ID = string | number, Data = unknown> {
  metadata: CrudTableOptions;
  id?: ID | undefined;
  data?: Data | undefined;
  currentUser?: JwtPayload;
  bypassQueue?: boolean;
  waitForJobCompletion?: (queueName: string, job: Job) => Promise<unknown>;
  invalidateCache?: (metadata: CrudTableOptions, id?: ID) => Promise<void>;
}

export interface BaseOperationParams<ID = string | number, Data = unknown> extends OperationCommon<ID, Data> {
  repository: CrudRepository<Data, ID>;
  category: string;
  name: string;
}

export interface QueueOperationParams<ID = string | number, Data = unknown> extends OperationCommon<ID, Data> {
  waitForJobCompletion: (queueName: string, job: Job) => Promise<unknown>;
  invalidateCache: (metadata: CrudTableOptions, id?: ID) => Promise<void>;
}

export interface ExecuteOperationOptions<ID = string | number, Data = unknown> {
  params: BaseOperationParams<ID, Data>;
  jobType: CrudOperationLogType;
  method: (repository: CrudRepository<Data, ID>, id?: ID, data?: Data, currentUser?: JwtPayload) => Promise<void>;
}

export interface ExecuteQueueOperationOptions<ID = string | number, Data = unknown> {
  params: QueueOperationParams<ID, Data>;
  jobType: CrudOperationLogType;
}

export interface OperationResult<ID = string | number> {
  success: true;
  id: ID | undefined;
}
