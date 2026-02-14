import { JobStatus } from '../../enums/infra/job-status.enum';

export interface CommandJobData {
  jobId: string;
  status: JobStatus;
  timestamp: number;
  result?: unknown;
  error?: string;
}
