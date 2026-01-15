/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Create users table
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
    password_hash: { type: 'varchar(255)' },
    role: { type: 'varchar(50)', default: "'user'", check: "role IN ('admin', 'user', 'moderator')" },
    last_login: { type: 'timestamp with time zone' },
    is_email_verified: { type: 'boolean', default: false }
  });

  // Create indexes
  pgm.createIndex('users', 'email', { name: 'idx_users_email' });
  pgm.createIndex('users', 'is_active', { name: 'idx_users_is_active' });
  pgm.createIndex('users', 'role', { name: 'idx_users_role' });
  pgm.createIndex('users', 'is_email_verified', { name: 'idx_users_email_verified' });

  // Create trigger function
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true
    },
    `
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    `
  );

  // Create trigger
  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  // Insert seed data
  pgm.sql(`
    INSERT INTO users (email, first_name, last_name, is_active, is_email_verified, role, password_hash) VALUES
      ('guliyev.yavar@example.com', 'Yavar', 'Guliyev', true, true, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('john.doe@example.com', 'John', 'Doe', false, false, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('jane.smith@example.com', 'Jane', 'Smith', false, false, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('bob.johnson@example.com', 'Bob', 'Johnson', false, false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG')
    ON CONFLICT (email) DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTrigger('users', 'update_users_updated_at', { ifExists: true });
  pgm.dropFunction('update_updated_at_column', [], { ifExists: true });
  pgm.dropTable('users', { ifExists: true });
};
