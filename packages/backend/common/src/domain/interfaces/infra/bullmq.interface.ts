import { JobsOptions, QueueOptions, WorkerOptions } from 'bullmq';

import { AppRoles } from '../../enums/auth/auth.enum';
import { WorkerStatus, OperationStatus } from '../../types/common/status.type';
import { JobBackoffType, DataProcessingOperation, ReportType } from '../../types/infra/bullmq.type';
import { InjectionToken } from '../../types/module/provider.type';
import { ComputeOptions } from './infra-common.interface';

export interface WithJobId {
  jobId?: string;
}

export interface WithUserId {
  userId: number;
}

export interface BaseJobData extends WithJobId, WithUserId {}

export interface WithAttempts {
  attempts?: number;
}

export interface WithBackoff {
  backoff?: { delay: number; type: JobBackoffType };
}

export interface WithConcurrency {
  concurrency?: number;
}

export interface JobOptions extends WithAttempts, WithBackoff, WithConcurrency {}

export interface ComputeJobData {
  taskName: string;
  args: unknown[];
  timestamp: number;
}

export interface DataProcessingJobData extends BaseJobData {
  datasetId: string;
  operation: DataProcessingOperation;
  parameters: Record<string, unknown>;
}

export interface ReportJobData extends BaseJobData {
  dateRange: { start: string; end: string };
  filters: Record<string, unknown>;
  reportType: ReportType;
}

export interface JobData {
  handlerKey: string;
  args: unknown[];
}

export interface PatchedMethod {
  (...args: unknown[]): unknown;
  __original__?: (...args: unknown[]) => unknown;
}

export interface ComputeHandler {
  serviceToken: InjectionToken;
  methodName: string;
  options: ComputeOptions;
}

export interface BullMQJobHandlerMetadata {
  methodName: string;
  jobName: string;
  options?: JobOptions;
}

export interface ComputeModuleOptions {
  enableWorker?: boolean;
  enableApi?: boolean;
  autoSpawn?: boolean;
  workerMinCount?: number;
  workerMaxCount?: number;
}

export interface ComputeConfig {
  COMPUTE_AUTO_SPAWN: boolean;
  COMPUTE_APP_ROLE: AppRoles;
  COMPUTE_MIN_WORKERS: number;
  COMPUTE_MAX_WORKERS: number;
}

export interface BullMQModuleOptions {
  defaultJobOptions?: JobsOptions;
  queueOptions?: Partial<QueueOptions>;
  redis: {
    db?: number;
    host: string;
    password?: string;
    port?: number;
    concurrency?: number;
    removeOnComplete?: number;
    removeOnFail?: number;
    attempts?: number;
    backoff?: { type: JobBackoffType; delay: number };
  };
  workerOptions?: Partial<WorkerOptions>;
}

export interface QueueMetadata {
  name: string;
  options?: Partial<QueueOptions>;
}

export interface QueueHealth {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface ComputeServiceStatus {
  workerEnabled: boolean;
  workerStatus: WorkerStatus;
  pendingJobsCount: number;
  handlersCount: number;
}

export interface JobResponse extends WithJobId {
  status: OperationStatus;
  message?: string;
}

export interface PendingJob {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}
