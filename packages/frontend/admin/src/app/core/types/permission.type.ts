import { CONFLICT_RESOLUTION_STRATEGIES, CONFLICT_TYPES } from '../constants/permission.const';

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];

export type ConflictResolutionStrategy = (typeof CONFLICT_RESOLUTION_STRATEGIES)[keyof typeof CONFLICT_RESOLUTION_STRATEGIES];

export type PermisionType = 'validation' | 'conflict' | 'permission' | 'network' | 'server';
