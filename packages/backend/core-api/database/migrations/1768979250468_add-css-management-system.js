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
  // ===============================================
  // 1. CSS FILES METADATA TABLE
  // ===============================================
  pgm.createTable('css_files', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    file_name: { type: 'varchar(255)', notNull: true },
    file_path: { type: 'text', notNull: true },
    description: { type: 'text' },
    is_empty: { type: 'boolean', default: false },
    file_size: { type: 'integer', default: 0 },
    category: { type: 'varchar(100)' }, // e.g., 'features', 'shared', 'components', 'styles'
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint and indexes
  pgm.addConstraint('css_files', 'unique_file_path', { unique: ['file_path'] });
  pgm.createIndex('css_files', 'category', { name: 'idx_css_files_category' });
  pgm.createIndex('css_files', 'file_name', { name: 'idx_css_files_name' });

  // ===============================================
  // 2. CSS TOKENS/VARIABLES TABLE (Design System)
  // ===============================================
  pgm.createTable('css_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    token_name: { type: 'varchar(255)', notNull: true }, // e.g., '--primary', '--bg-card'
    token_category: { type: 'varchar(100)', notNull: true }, // e.g., 'colors', 'spacing', 'typography'
    token_type: { type: 'varchar(50)', notNull: true }, // e.g., 'color', 'size', 'font', 'gradient'
    default_value: { type: 'text', notNull: true },
    light_mode_value: { type: 'text' },
    dark_mode_value: { type: 'text' },
    description: { type: 'text' },
    is_customizable: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint and indexes
  pgm.addConstraint('css_tokens', 'unique_token_name', { unique: ['token_name'] });
  pgm.createIndex('css_tokens', 'token_category', { name: 'idx_css_tokens_category' });
  pgm.createIndex('css_tokens', 'token_type', { name: 'idx_css_tokens_type' });

  // ===============================================
  // 3. CSS RULES TABLE (Actual CSS Rules)
  // ===============================================
  pgm.createTable('css_rules', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    file_id: { type: 'uuid', notNull: true, references: 'css_files(id)', onDelete: 'CASCADE' },
    selector: { type: 'text', notNull: true }, // e.g., 'h2', '.nav-label', '.btn-primary'
    properties: { type: 'jsonb', notNull: true }, // Store CSS properties as JSON
    rule_order: { type: 'integer', notNull: true }, // Order within the file
    is_important: { type: 'boolean', default: false }, // Has !important flag
    applies_to_theme: { type: 'varchar(20)' }, // 'both', 'dark', 'light'
    line_number: { type: 'integer' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add indexes
  pgm.createIndex('css_rules', 'file_id', { name: 'idx_css_rules_file' });
  pgm.createIndex('css_rules', 'selector', { name: 'idx_css_rules_selector' });
  pgm.createIndex('css_rules', 'properties', { name: 'idx_css_rules_properties', method: 'gin' });

  // ===============================================
  // 4. THEME VERSIONS TABLE (Versioning System)
  // ===============================================
  pgm.createTable('theme_versions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    version_name: { type: 'varchar(100)', notNull: true },
    version_number: { type: 'integer', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: "'draft'", check: "status IN ('draft', 'published', 'archived')" },
    is_active: { type: 'boolean', default: false },
    token_overrides: { type: 'jsonb' }, // Store token overrides for this version
    description: { type: 'text' },
    created_by: { type: 'uuid' }, // Reference to user who created
    published_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add constraints and indexes
  pgm.addConstraint('theme_versions', 'unique_version_number', { unique: ['version_number'] });
  pgm.createIndex('theme_versions', 'is_active', { name: 'idx_theme_active', where: 'is_active = true', unique: true });
  pgm.createIndex('theme_versions', 'status', { name: 'idx_theme_status' });

  // ===============================================
  // 5. TOKEN USAGE TABLE (Track which tokens are used where)
  // ===============================================
  pgm.createTable('token_usage', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    token_id: { type: 'uuid', notNull: true, references: 'css_tokens(id)', onDelete: 'CASCADE' },
    rule_id: { type: 'uuid', notNull: true, references: 'css_rules(id)', onDelete: 'CASCADE' },
    property_name: { type: 'varchar(100)', notNull: true }, // e.g., 'background', 'color'
    usage_context: { type: 'text' }, // Additional context about usage
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint and indexes
  pgm.addConstraint('token_usage', 'unique_token_rule_property', { unique: ['token_id', 'rule_id', 'property_name'] });
  pgm.createIndex('token_usage', 'token_id', { name: 'idx_token_usage_token' });
  pgm.createIndex('token_usage', 'rule_id', { name: 'idx_token_usage_rule' });

  // ===============================================
  // 6. CSS GRADIENTS TABLE (Special handling for gradients)
  // ===============================================
  pgm.createTable('css_gradients', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    gradient_name: { type: 'varchar(100)', notNull: true }, // e.g., 'linear1', 'linear2'
    gradient_value: { type: 'text', notNull: true },
    gradient_type: { type: 'varchar(50)', notNull: true }, // 'linear', 'radial', 'conic'
    description: { type: 'text' },
    is_system_gradient: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint and indexes
  pgm.addConstraint('css_gradients', 'unique_gradient_name', { unique: ['gradient_name'] });
  pgm.createIndex('css_gradients', 'gradient_type', { name: 'idx_gradients_type' });

  // ===============================================
  // 7. BACKUP METADATA TABLE (Track backups)
  // ===============================================
  pgm.createTable('css_backups', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    backup_name: { type: 'varchar(255)', notNull: true },
    backup_date: { type: 'timestamp', notNull: true },
    total_files: { type: 'integer', notNull: true },
    location: { type: 'text' },
    purpose: { type: 'text' },
    notes: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint
  pgm.addConstraint('css_backups', 'unique_backup_name', { unique: ['backup_name'] });

  // ===============================================
  // 8. AUDIT LOG TABLE (Track all changes)
  // ===============================================
  pgm.createTable('css_audit_log', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    entity_type: { type: 'varchar(50)', notNull: true }, // 'token', 'rule', 'theme', 'file'
    entity_id: { type: 'uuid', notNull: true },
    action: { type: 'varchar(50)', notNull: true }, // 'create', 'update', 'delete', 'publish'
    old_value: { type: 'jsonb' },
    new_value: { type: 'jsonb' },
    changed_by: { type: 'uuid' }, // Reference to user
    change_reason: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Add indexes for audit queries
  pgm.createIndex('css_audit_log', ['entity_type', 'entity_id'], { name: 'idx_audit_entity' });
  pgm.createIndex('css_audit_log', 'created_at', { name: 'idx_audit_date' });
  pgm.createIndex('css_audit_log', 'changed_by', { name: 'idx_audit_user' });

  // ===============================================
  // TRIGGERS: Auto-update timestamps (reuse existing function)
  // ===============================================
  
  // Apply trigger to all CSS management tables
  pgm.createTrigger('css_files', 'update_css_files_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('css_tokens', 'update_css_tokens_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('css_rules', 'update_css_rules_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('theme_versions', 'update_theme_versions_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('token_usage', 'update_token_usage_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('css_gradients', 'update_css_gradients_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('css_backups', 'update_css_backups_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  pgm.createTrigger('css_audit_log', 'update_css_audit_log_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW'
  });

  // ===============================================
  // SEED DATA: CSS Files Metadata
  // ===============================================

  // Insert CSS files metadata
  pgm.sql(`
    INSERT INTO css_files (file_name, file_path, description, is_empty, file_size, category)
    VALUES 
      ('app.css', 'packages/frontend/admin/src/app/app.css', 'Main app CSS file', true, 0, 'global'),
      ('styles.css', 'packages/frontend/admin/src/styles.css', 'Global styles with CSS variables, themes, and utility classes', false, 22671, 'global'),
      ('dashboard.css', 'packages/frontend/admin/src/app/features/dashboard/dashboard.css', 'Dashboard page styling with stats grid, cards, and health components', false, 9270, 'features'),
      ('database.css', 'packages/frontend/admin/src/app/features/database/database.css', 'Database page styling with schema tree, tables, and CRUD operations', false, 19733, 'features'),
      ('health.css', 'packages/frontend/admin/src/app/features/health/health.css', 'Health monitoring page styling with status indicators and diagnostics', false, 8787, 'features'),
      ('login.css', 'packages/frontend/admin/src/app/features/login/login.css', 'Login page styling with form elements and authentication UI', false, 1659, 'features'),
      ('profile.css', 'packages/frontend/admin/src/app/features/profile/profile.css', 'User profile page styling with avatar and form components', false, 5583, 'features'),
      ('settings.css', 'packages/frontend/admin/src/app/features/settings/settings.css', 'Settings page styling with toggle switches and configuration UI', false, 1521, 'features'),
      ('action-buttons.css', 'packages/frontend/admin/src/app/shared/components/action-buttons/action-buttons.css', 'Reusable action button components with hover effects', false, 2690, 'components'),
      ('sidebar.css', 'packages/frontend/admin/src/app/shared/components/sidebar/sidebar.css', 'Navigation sidebar styling with menu items and branding', false, 4691, 'components'),
      ('toggle-switch.css', 'packages/frontend/admin/src/app/shared/components/toggle-switch/toggle-switch.css', 'Custom toggle switch component styling', false, 2727, 'components'),
      ('topbar.css', 'packages/frontend/admin/src/app/shared/components/topbar/topbar.css', 'Top navigation bar styling with user actions and breadcrumbs', false, 1935, 'components'),
      ('table.css', 'packages/frontend/admin/src/app/shared/styles/table.css', 'Centralized table styling for CRUD operations and data display', false, 2730, 'styles')
    ON CONFLICT (file_path) DO NOTHING;
  `);

  // Insert CSS tokens (Design System)
  pgm.sql(`
    INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
    VALUES 
      ('--primary', 'colors', 'color', '#00d2ff', '#1d4ed8', '#00d2ff', 'Primary brand color', true),
      ('--primary-glow', 'colors', 'color', 'rgba(0, 210, 255, 0.4)', 'rgba(29, 78, 216, 0.3)', 'rgba(0, 210, 255, 0.4)', 'Primary glow effect', true),
      ('--secondary', 'colors', 'color', '#9d50bb', '#7c3aed', '#9d50bb', 'Secondary brand color', true),
      ('--secondary-glow', 'colors', 'color', 'rgba(157, 80, 187, 0.4)', 'rgba(124, 58, 237, 0.3)', 'rgba(157, 80, 187, 0.4)', 'Secondary glow effect', true),
      ('--bg-deep', 'colors', 'color', '#050a14', '#f9fafb', '#050a14', 'Deep background color', true),
      ('--bg-card', 'colors', 'color', 'rgba(15, 25, 45, 0.7)', 'rgba(255, 255, 255, 0.98)', 'rgba(15, 25, 45, 0.7)', 'Card background color', true),
      ('--bg-sidebar', 'colors', 'color', 'rgba(10, 20, 35, 0.9)', 'rgba(255, 255, 255, 0.98)', 'rgba(10, 20, 35, 0.9)', 'Sidebar background color', true),
      ('--text-main', 'colors', 'color', '#e2e8f0', '#111827', '#e2e8f0', 'Main text color', true),
      ('--text-muted', 'colors', 'color', '#94a3b8', '#4b5563', '#94a3b8', 'Muted text color', true),
      ('--border', 'colors', 'color', 'rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.1)', 'Border color', true),
      ('--success', 'colors', 'color', '#10b981', '#059669', '#10b981', 'Success state color', true),
      ('--warning', 'colors', 'color', '#f59e0b', '#d97706', '#f59e0b', 'Warning state color', true),
      ('--danger', 'colors', 'color', '#ef4444', '#dc2626', '#ef4444', 'Danger state color', true),
      ('--console-bg', 'colors', 'color', '#000', '#ffffff', '#000', 'Console background color', true),
      ('--console-text', 'colors', 'color', '#e2e8f0', '#111827', '#e2e8f0', 'Console text color', true),
      ('--dashboard-accent', 'colors', 'color', '#1e40af', '#1e40af', '#1e40af', 'Dashboard accent color', true),
      ('--database-accent', 'colors', 'color', '#059669', '#059669', '#059669', 'Database accent color', true),
      ('--health-accent', 'colors', 'color', '#d97706', '#d97706', '#d97706', 'Health page accent color', true),
      ('--settings-accent', 'colors', 'color', '#7c3aed', '#7c3aed', '#7c3aed', 'Settings accent color', true),
      ('--profile-accent', 'colors', 'color', '#0d9488', '#0d9488', '#0d9488', 'Profile accent color', true),
      ('--btn-primary-start', 'colors', 'color', '#ce1bfb', '#1d4ed8', '#ce1bfb', 'Primary button gradient start color', true),
      ('--btn-primary-end', 'colors', 'color', '#35e6cc', '#3b82f6', '#35e6cc', 'Primary button gradient end color', true),
      ('--btn-secondary-bg', 'colors', 'color', 'rgba(255, 255, 255, 0.08)', 'rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.08)', 'Secondary button background', true),
      ('--btn-secondary-hover', 'colors', 'color', 'rgba(255, 255, 255, 0.15)', 'rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.15)', 'Secondary button hover background', true),
      ('--toggle-bg-off', 'colors', 'color', 'rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)', 'Toggle switch background when off', true),
      ('--toggle-bg-on', 'colors', 'color', 'linear-gradient(81deg, #ce1bfb 10.86%, #35e6cc 89.96%)', 'linear-gradient(81deg, #1d4ed8 10.86%, #3b82f6 89.96%)', 'linear-gradient(81deg, #ce1bfb 10.86%, #35e6cc 89.96%)', 'Toggle switch background when on', true),
      ('--toggle-handle', 'colors', 'color', '#ffffff', '#ffffff', '#ffffff', 'Toggle switch handle color', true),
      ('--sidebar-width', 'spacing', 'size', '260px', '260px', '260px', 'Sidebar width', true),
      ('--font-family', 'typography', 'font', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', 'Primary font family', true)
    ON CONFLICT (token_name) DO NOTHING;
  `);

  // Insert CSS gradients
  pgm.sql(`
    INSERT INTO css_gradients (gradient_name, gradient_value, gradient_type, description, is_system_gradient)
    VALUES 
      ('linear1', 'linear-gradient(81deg, #CE1BFB 10.86%, #35E6CC 89.96%)', 'linear', 'Primary gradient - Pink to Cyan', true),
      ('linear2', 'linear-gradient(81deg, #F253BA -2%, #FF6C80 29.96%, #FFF94F 63.99%)', 'linear', 'Vibrant gradient - Pink to Yellow', true),
      ('linear3', 'linear-gradient(100deg, #00BAD4 7.72%, #2194FF 118.76%)', 'linear', 'Blue gradient - Cyan to Blue', true),
      ('linear4', 'linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.03) 100%)', 'linear', 'White fade gradient', true),
      ('linear5', 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.64) 69.03%, #000 96.4%)', 'linear', 'Black fade gradient', true),
      ('linear6', 'linear-gradient(85deg, #A05DFE 3.63%, #5ECBDE 29.42%)', 'linear', 'Purple to Cyan gradient', true),
      ('linear7', 'linear-gradient(113deg, #EA1D62 5.37%, #F2944F 108.05%)', 'linear', 'Red to Orange gradient', true),
      ('linear8', 'linear-gradient(100deg, #00D426 7.72%, #21FFF2 118.76%)', 'linear', 'Green to Cyan gradient', true),
      ('linear9', 'linear-gradient(41deg, #00BAD4 7.72%, #2194FF 55.76%, #A05DFE 93.63%)', 'linear', 'Multi-color gradient - Cyan to Blue to Purple', true)
    ON CONFLICT (gradient_name) DO NOTHING;
  `);

  // Insert initial theme version
  pgm.sql(`
    INSERT INTO theme_versions (version_name, version_number, status, is_active, description, published_at)
    VALUES 
      ('Default Theme v1.0', 1, 'published', true, 'Initial production theme with gradient system', CURRENT_TIMESTAMP)
    ON CONFLICT (version_number) DO NOTHING;
  `);

  // Insert CSS backup metadata
  pgm.sql(`
    INSERT INTO css_backups (backup_name, backup_date, total_files, location, purpose, notes)
    VALUES 
      ('complete-css-backup-2026-01-20', '2026-01-20', 13, 'packages/frontend/styles/', 'Backup and reference for all CSS styling in the admin application', 'This is a backup copy - do not modify original CSS files')
    ON CONFLICT (backup_name) DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop triggers first
  pgm.dropTrigger('css_audit_log', 'update_css_audit_log_updated_at', { ifExists: true });
  pgm.dropTrigger('css_backups', 'update_css_backups_updated_at', { ifExists: true });
  pgm.dropTrigger('css_gradients', 'update_css_gradients_updated_at', { ifExists: true });
  pgm.dropTrigger('token_usage', 'update_token_usage_updated_at', { ifExists: true });
  pgm.dropTrigger('theme_versions', 'update_theme_versions_updated_at', { ifExists: true });
  pgm.dropTrigger('css_rules', 'update_css_rules_updated_at', { ifExists: true });
  pgm.dropTrigger('css_tokens', 'update_css_tokens_updated_at', { ifExists: true });
  pgm.dropTrigger('css_files', 'update_css_files_updated_at', { ifExists: true });

  // Drop tables in reverse order (respecting foreign key dependencies)
  pgm.dropTable('css_audit_log', { ifExists: true });
  pgm.dropTable('css_backups', { ifExists: true });
  pgm.dropTable('css_gradients', { ifExists: true });
  pgm.dropTable('token_usage', { ifExists: true });
  pgm.dropTable('theme_versions', { ifExists: true });
  pgm.dropTable('css_rules', { ifExists: true });
  pgm.dropTable('css_tokens', { ifExists: true });
  pgm.dropTable('css_files', { ifExists: true });
};
