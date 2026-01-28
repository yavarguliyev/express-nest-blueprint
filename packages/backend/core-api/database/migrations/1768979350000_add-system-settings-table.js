exports.up = (pgm) => {
  pgm.createTable('system_settings', {
    id: 'id',
    key: {
      type: 'varchar(100)',
      notNull: true,
      unique: true
    },
    value: {
      type: 'boolean',
      notNull: true
    },
    category: {
      type: 'varchar(50)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  pgm.createIndex('system_settings', 'key');
  pgm.createIndex('system_settings', 'category');
  pgm.createIndex('system_settings', 'is_active');

  pgm.createTrigger('system_settings', 'update_system_settings_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.sql(`
    INSERT INTO system_settings (key, value, category, description) VALUES
    ('maintenance_mode', false, 'System', 'Disable public access to the API'),
    ('debug_logging', true, 'System', 'Enable verbose logging for all requests'),
    ('allow_registration', true, 'Security', 'Enable/disable new user signups'),
    ('enforce_mfa', false, 'Security', 'Require Multi-Factor Authentication for all users')
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('system_settings');
};