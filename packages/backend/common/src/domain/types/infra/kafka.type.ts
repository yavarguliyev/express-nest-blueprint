import { KafkaMessagePayload } from '../../interfaces/infra/kafka.interface';

export type KafkaMessageHandler<T = unknown> = (payload: KafkaMessagePayload<T>) => Promise<void> | void;
