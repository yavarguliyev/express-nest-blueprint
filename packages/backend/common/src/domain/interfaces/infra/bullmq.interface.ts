import { JobsOptions, QueueOptions, WorkerOptions } from 'bullmq';

import { ComputeOptions } from './infra-common.interface';
import { AppRoles } from '../../enums/auth/auth.enum';
import { OperationStatus, WorkerStatus } from '../../types/common/status.type';
import { InjectionToken } from '../../types/module/provider.type';
import { DataProcessingOperation, JobBackoffType, ReportType } from '../../types/infra/bullmq.type';

export interface BaseJobData {
  jobId?: string;
  userId: number;
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

export interface ComputeJobData {
  taskName: string;
  args: unknown[];
  timestamp: number;
}

export interface ComputeModuleOptions {
  enableWorker?: boolean;
  enableApi?: boolean;
  autoSpawn?: boolean;
  workerMinCount?: number;
  workerMaxCount?: number;
}

export interface ComputeHandler {
  serviceToken: InjectionToken;
  methodName: string;
  options: ComputeOptions;
}

export interface ComputeConfig {
  COMPUTE_AUTO_SPAWN: boolean;
  COMPUTE_APP_ROLE: AppRoles;
  COMPUTE_MIN_WORKERS: number;
  COMPUTE_MAX_WORKERS: number;
}

export interface DataProcessingJobData extends BaseJobData {
  datasetId: string;
  operation: DataProcessingOperation;
  parameters: Record<string, unknown>;
}

export interface JobData {
  handlerKey: string;
  args: unknown[];
}

export interface JobHandlerOptions {
  attempts?: number;
  backoff?: { delay: number; type: JobBackoffType };
  concurrency?: number;
}

export interface PatchedMethod {
  (...args: unknown[]): unknown;
  __original__?: (...args: unknown[]) => unknown;
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

export interface ReportJobData extends BaseJobData {
  dateRange: { end: string; start: string };
  filters: Record<string, unknown>;
  reportType: ReportType;
}

export interface PendingJob {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

export interface ComputeServiceStatus {
  workerEnabled: boolean;
  workerStatus: WorkerStatus;
  pendingJobsCount: number;
  handlersCount: number;
}
export interface JobResponse {
  jobId: string;
  status: OperationStatus;
  message?: string;
}

export interface BullMQJobHandlerMetadata {
  methodName: string;
  jobName: string;
  options?: JobHandlerOptions;
}
