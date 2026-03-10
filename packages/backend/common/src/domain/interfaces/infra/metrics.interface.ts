import { MetricValue } from 'prom-client';

import { PrometheusValue } from '../../types/infra/metrics.type';

export interface PromMetric {
  name: string;
  help: string;
  type: string;
  values: MetricValue<string>[];
  aggregator: string;
}

export interface PrometheusQueryResult {
  metric: Record<string, string>;
  value: PrometheusValue;
}

export interface PrometheusQueryData {
  resultType: string;
  result: PrometheusQueryResult[];
}

export interface PrometheusQueryResponse {
  status: string;
  data: PrometheusQueryData;
  error?: string;
}
