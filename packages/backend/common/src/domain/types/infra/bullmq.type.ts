import { Job } from 'bullmq';

import { DataProcessingJobData, ReportJobData } from '../../interfaces/infra/bullmq.interface';

export type DataProcessingOperation = 'analyze' | 'export' | 'transform';

export type JobBackoffType = 'exponential' | 'fixed' | (string & {});

export type JobPayload = DataProcessingJobData | ReportJobData;

export type JobDataType = Job<JobPayload>;

export type ReportType = 'analytics' | 'financial' | 'sales';
