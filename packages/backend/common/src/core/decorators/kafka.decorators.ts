import { INJECTABLE_METADATA } from './injectable.decorator';
import { KAFKA_SUBSCRIBER_METADATA, KAFKA_ON_MESSAGE_METADATA, KAFKA_SUBSCRIBER_REGISTRY } from '../../domain/constants/infra/kafka.const';
import { KafkaSubscriberMetadata } from 'domain/interfaces/infra/kafka.interface';
import { KafkaSubscribeOptions } from '../../domain/interfaces/infra/kafka.interface';
import { Constructor } from '../../domain/types/common/util.type';

export const KAFKA_OPTIONS = Symbol('KAFKA_OPTIONS');

export const Subscriber = (): ClassDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(KAFKA_SUBSCRIBER_METADATA, true, target);
    Reflect.defineMetadata(INJECTABLE_METADATA, true, target);
    KAFKA_SUBSCRIBER_REGISTRY.push(target as Constructor);
  };
};

export const OnMessage = (topic: string | RegExp | KafkaSubscribeOptions): MethodDecorator => {
  return (target: object, propertyKey: string | symbol): void => {
    const options: KafkaSubscribeOptions = typeof topic === 'string' || topic instanceof RegExp ? { topic } : topic;
    const existingHandlers = (Reflect.getMetadata(KAFKA_ON_MESSAGE_METADATA, target.constructor) || []) as KafkaSubscriberMetadata[];

    existingHandlers.push({ methodName: propertyKey as string, options });
    Reflect.defineMetadata(KAFKA_ON_MESSAGE_METADATA, existingHandlers, target.constructor);
  };
};
