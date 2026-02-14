export const KAFKA_TOPICS = {
  USER: { topic: 'user.events', type: 'USER_EVENT', title: 'User Event', fromBeginning: true },
  USER_CREATE: { topic: 'user.create.command', type: 'USER_CREATE', title: 'Create User', fromBeginning: false },
  USER_UPDATE: { topic: 'user.update.command', type: 'USER_UPDATE', title: 'Update User', fromBeginning: false },
  USER_DELETE: { topic: 'user.delete.command', type: 'USER_DELETE', title: 'Delete User', fromBeginning: false },
  USER_CREATED: { topic: 'user.created.event', type: 'USER_CREATED', title: 'User Created', fromBeginning: true },
  USER_UPDATED: { topic: 'user.updated.event', type: 'USER_UPDATED', title: 'User Updated', fromBeginning: true },
  USER_DELETED: { topic: 'user.deleted.event', type: 'USER_DELETED', title: 'User Deleted', fromBeginning: true },
  USER_OPERATION_FAILED: { topic: 'user.operation.failed', type: 'USER_OPERATION_FAILED', title: 'User Operation Failed', fromBeginning: true }
} as const;
