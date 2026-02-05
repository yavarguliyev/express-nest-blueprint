import { MetricValue } from 'prom-client';

export interface PromMetric {
  name: string;
  help: string;
  type: string;
  values: MetricValue<string>[];
  aggregator: string;
}
