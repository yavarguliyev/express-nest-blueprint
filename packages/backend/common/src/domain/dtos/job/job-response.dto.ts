import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { JobStatus } from '../../enums/infra/job-status.enum';

export class JobResponseDto {
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @IsEnum(JobStatus)
  @IsNotEmpty()
  status!: JobStatus;

  @IsString()
  @IsOptional()
  message?: string;

  @IsOptional()
  result?: unknown;

  @IsOptional()
  error?: string;
}
