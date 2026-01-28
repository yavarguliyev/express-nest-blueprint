export const shorthands = undefined;

export const up = pgm => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp with time zone', default: pgm.func('CURRENT_TIMESTAMP') },
    password_hash: { type: 'varchar(255)' },
    role: { type: 'varchar(50)', default: "'user'", check: "role IN ('global admin', 'admin', 'user', 'moderator')" },
    last_login: { type: 'timestamp with time zone' },
    is_email_verified: { type: 'boolean', default: false }
  });

  pgm.createIndex('users', 'email', { name: 'idx_users_email' });
  pgm.createIndex('users', 'is_active', { name: 'idx_users_is_active' });
  pgm.createIndex('users', 'role', { name: 'idx_users_role' });
  pgm.createIndex('users', 'is_email_verified', { name: 'idx_users_email_verified' });

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

  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.sql(`
    INSERT INTO users (email, first_name, last_name, is_active, is_email_verified, role, password_hash) VALUES
      ('guliyev.yavar@example.com', 'Yavar', 'Guliyev', true, true, 'global admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('john.doe@example.com', 'John', 'Doe', false, false, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('jane.smith@example.com', 'Jane', 'Smith', false, false, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('bob.johnson@example.com', 'Bob', 'Johnson', false, false, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('alice.wilson@example.com', 'Alice', 'Wilson', true, true, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('michael.brown@example.com', 'Michael', 'Brown', true, false, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('emily.davis@example.com', 'Emily', 'Davis', false, false, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('daniel.miller@example.com', 'Daniel', 'Miller', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('sophia.moore@example.com', 'Sophia', 'Moore', true, false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('william.taylor@example.com', 'William', 'Taylor', false, false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('olivia.anderson@example.com', 'Olivia', 'Anderson', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('james.thomas@example.com', 'James', 'Thomas', true, false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('charlotte.jackson@example.com', 'Charlotte', 'Jackson', false, false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
      ('henry.white@example.com', 'Henry', 'White', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG')
    ON CONFLICT (email) DO NOTHING;
  `);
};

export const down = pgm => {
  pgm.dropTrigger('users', 'update_users_updated_at', { ifExists: true });
  pgm.dropFunction('update_updated_at_column', [], { ifExists: true });
  pgm.dropTable('users', { ifExists: true });
};
