export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('notifications', {
    id: 'id',
    type: { type: 'varchar(50)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    message: { type: 'text', notNull: true },
    metadata: { type: 'jsonb' },
    entity_id: { type: 'integer' },
    entity_type: { type: 'varchar(50)' },
    recipient_id: { type: 'integer', notNull: true },
    is_read: { type: 'boolean', default: false },
    read_at: { type: 'timestamp with time zone' },
    created_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  pgm.addConstraint('notifications', 'fk_recipient', {
    foreignKeys: {
      columns: 'recipient_id',
      references: 'users(id)',
      onDelete: 'CASCADE'
    }
  });

  pgm.createIndex('notifications', 'recipient_id', { name: 'idx_notifications_recipient' });
  pgm.createIndex('notifications', ['recipient_id', 'is_read'], { 
    name: 'idx_notifications_recipient_unread',
    where: 'is_read = false'
  });
  pgm.createIndex('notifications', 'created_at', { name: 'idx_notifications_created' });
  pgm.createIndex('notifications', 'entity_type', { name: 'idx_notifications_entity_type' });

  pgm.createTrigger('notifications', 'update_notifications_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });
};

export const down = (pgm) => {
  pgm.dropTable('notifications', { ifExists: true });
};
