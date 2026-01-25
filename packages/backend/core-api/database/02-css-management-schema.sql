-- ===============================================
-- 1. CSS FILES METADATA TABLE
-- ===============================================
CREATE TABLE css_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    is_empty BOOLEAN DEFAULT false,
    file_size INTEGER DEFAULT 0,
    category VARCHAR(100), -- e.g., 'features', 'shared', 'components', 'styles'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_file_path UNIQUE(file_path)
);

-- Index for fast lookups
CREATE INDEX idx_css_files_category ON css_files(category);
CREATE INDEX idx_css_files_name ON css_files(file_name);

-- ===============================================
-- 2. CSS TOKENS/VARIABLES TABLE (Design System)
-- ===============================================
CREATE TABLE css_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_name VARCHAR(255) NOT NULL, -- e.g., '--primary', '--bg-card'
    token_category VARCHAR(100) NOT NULL, -- e.g., 'colors', 'spacing', 'typography'
    token_type VARCHAR(50) NOT NULL, -- e.g., 'color', 'size', 'font', 'gradient'
    default_value TEXT NOT NULL,
    light_mode_value TEXT,
    dark_mode_value TEXT,
    description TEXT,
    is_customizable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_token_name UNIQUE(token_name)
);

-- Index for token lookups
CREATE INDEX idx_css_tokens_category ON css_tokens(token_category);
CREATE INDEX idx_css_tokens_type ON css_tokens(token_type);

-- ===============================================
-- 3. CSS RULES TABLE (Actual CSS Rules)
-- ===============================================
CREATE TABLE css_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES css_files(id) ON DELETE CASCADE,
    selector TEXT NOT NULL, -- e.g., 'h2', '.nav-label', '.btn-primary'
    properties JSONB NOT NULL, -- Store CSS properties as JSON
    rule_order INTEGER NOT NULL, -- Order within the file
    is_important BOOLEAN DEFAULT false, -- Has !important flag
    applies_to_theme VARCHAR(20), -- 'both', 'dark', 'light'
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast rule lookups
CREATE INDEX idx_css_rules_file ON css_rules(file_id);
CREATE INDEX idx_css_rules_selector ON css_rules(selector);
CREATE INDEX idx_css_rules_properties ON css_rules USING GIN(properties);

-- ===============================================
-- 4. THEME VERSIONS TABLE (Versioning System)
-- ===============================================
CREATE TABLE theme_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_name VARCHAR(100) NOT NULL,
    version_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    is_active BOOLEAN DEFAULT false,
    token_overrides JSONB, -- Store token overrides for this version
    description TEXT,
    created_by UUID, -- Reference to user who created
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_version_number UNIQUE(version_number),
    CONSTRAINT check_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Only one active theme at a time
CREATE UNIQUE INDEX idx_theme_active ON theme_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_theme_status ON theme_versions(status);

-- ===============================================
-- 5. TOKEN USAGE TABLE (Track which tokens are used where)
-- ===============================================
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES css_tokens(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES css_rules(id) ON DELETE CASCADE,
    property_name VARCHAR(100) NOT NULL, -- e.g., 'background', 'color'
    usage_context TEXT, -- Additional context about usage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_token_rule_property UNIQUE(token_id, rule_id, property_name)
);

-- Indexes for tracking dependencies
CREATE INDEX idx_token_usage_token ON token_usage(token_id);
CREATE INDEX idx_token_usage_rule ON token_usage(rule_id);

-- ===============================================
-- 6. CSS GRADIENTS TABLE (Special handling for gradients)
-- ===============================================
CREATE TABLE css_gradients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gradient_name VARCHAR(100) NOT NULL, -- e.g., 'linear1', 'linear2'
    gradient_value TEXT NOT NULL,
    gradient_type VARCHAR(50) NOT NULL, -- 'linear', 'radial', 'conic'
    description TEXT,
    is_system_gradient BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_gradient_name UNIQUE(gradient_name)
);

CREATE INDEX idx_gradients_type ON css_gradients(gradient_type);

-- ===============================================
-- 7. BACKUP METADATA TABLE (Track backups)
-- ===============================================
CREATE TABLE css_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name VARCHAR(255) NOT NULL,
    backup_date TIMESTAMP NOT NULL,
    total_files INTEGER NOT NULL,
    location TEXT,
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_backup_name UNIQUE(backup_name)
);

-- ===============================================
-- 8. AUDIT LOG TABLE (Track all changes)
-- ===============================================
CREATE TABLE css_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'token', 'rule', 'theme', 'file'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish'
    old_value JSONB,
    new_value JSONB,
    changed_by UUID, -- Reference to user
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_audit_entity ON css_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON css_audit_log(created_at);
CREATE INDEX idx_audit_user ON css_audit_log(changed_by);

-- ===============================================
-- TRIGGER: Auto-update timestamps
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_css_files_updated_at BEFORE UPDATE ON css_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_tokens_updated_at BEFORE UPDATE ON css_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_rules_updated_at BEFORE UPDATE ON css_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_versions_updated_at BEFORE UPDATE ON theme_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_usage_updated_at BEFORE UPDATE ON token_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_gradients_updated_at BEFORE UPDATE ON css_gradients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_backups_updated_at BEFORE UPDATE ON css_backups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_css_audit_log_updated_at BEFORE UPDATE ON css_audit_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SEED DATA: CSS Files Metadata
-- ===============================================

-- 1. Global Styles
INSERT INTO css_files (file_name, file_path, description, is_empty, file_size, category)
VALUES 
    ('app.css', 'packages/frontend/admin/src/app/app.css', 'Main app CSS file', true, 0, 'global'),
    ('styles.css', 'packages/frontend/admin/src/styles.css', 'Global styles with CSS variables, themes, and utility classes', false, 22671, 'global');

-- 2. Feature Pages
INSERT INTO css_files (file_name, file_path, description, is_empty, file_size, category)
VALUES 
    ('dashboard.css', 'packages/frontend/admin/src/app/features/dashboard/dashboard.css', 'Dashboard page styling with stats grid, cards, and health components', false, 9270, 'features'),
    ('database.css', 'packages/frontend/admin/src/app/features/database/database.css', 'Database page styling with schema tree, tables, and CRUD operations', false, 19733, 'features'),
    ('health.css', 'packages/frontend/admin/src/app/features/health/health.css', 'Health monitoring page styling with status indicators and diagnostics', false, 8787, 'features'),
    ('login.css', 'packages/frontend/admin/src/app/features/login/login.css', 'Login page styling with form elements and authentication UI', false, 1659, 'features'),
    ('profile.css', 'packages/frontend/admin/src/app/features/profile/profile.css', 'User profile page styling with avatar and form components', false, 5583, 'features'),
    ('settings.css', 'packages/frontend/admin/src/app/features/settings/settings.css', 'Settings page styling with toggle switches and configuration UI', false, 1521, 'features');

-- 3. Shared Components
INSERT INTO css_files (file_name, file_path, description, is_empty, file_size, category)
VALUES 
    ('action-buttons.css', 'packages/frontend/admin/src/app/shared/components/action-buttons/action-buttons.css', 'Reusable action button components with hover effects', false, 2690, 'components'),
    ('sidebar.css', 'packages/frontend/admin/src/app/shared/components/sidebar/sidebar.css', 'Navigation sidebar styling with menu items and branding', false, 4691, 'components'),
    ('toggle-switch.css', 'packages/frontend/admin/src/app/shared/components/toggle-switch/toggle-switch.css', 'Custom toggle switch component styling', false, 2727, 'components'),
    ('topbar.css', 'packages/frontend/admin/src/app/shared/components/topbar/topbar.css', 'Top navigation bar styling with user actions and breadcrumbs', false, 1935, 'components');

-- 4. Shared Styles
INSERT INTO css_files (file_name, file_path, description, is_empty, file_size, category)
VALUES 
    ('table.css', 'packages/frontend/admin/src/app/shared/styles/table.css', 'Centralized table styling for CRUD operations and data display', false, 2730, 'styles');

-- ===============================================
-- SEED DATA: CSS Tokens (Design System)
-- ===============================================

-- Color Tokens (Dark Mode as default)
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
    ('--console-text', 'colors', 'color', '#e2e8f0', '#111827', '#e2e8f0', 'Console text color', true);

-- Page-Specific Accent Colors
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--dashboard-accent', 'colors', 'color', '#1e40af', '#1e40af', '#1e40af', 'Dashboard accent color', true),
    ('--database-accent', 'colors', 'color', '#059669', '#059669', '#059669', 'Database accent color', true),
    ('--health-accent', 'colors', 'color', '#d97706', '#d97706', '#d97706', 'Health page accent color', true),
    ('--settings-accent', 'colors', 'color', '#7c3aed', '#7c3aed', '#7c3aed', 'Settings accent color', true),
    ('--profile-accent', 'colors', 'color', '#0d9488', '#0d9488', '#0d9488', 'Profile accent color', true);

-- Button Color Tokens
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--btn-primary-start', 'colors', 'color', '#ce1bfb', '#1d4ed8', '#ce1bfb', 'Primary button gradient start color', true),
    ('--btn-primary-end', 'colors', 'color', '#35e6cc', '#3b82f6', '#35e6cc', 'Primary button gradient end color', true),
    ('--btn-primary-hover-start', 'colors', 'color', '#d63dfc', '#2563eb', '#d63dfc', 'Primary button hover gradient start color', true),
    ('--btn-primary-hover-end', 'colors', 'color', '#4ae9d1', '#60a5fa', '#4ae9d1', 'Primary button hover gradient end color', true),
    ('--btn-secondary-bg', 'colors', 'color', 'rgba(255, 255, 255, 0.08)', 'rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.08)', 'Secondary button background', true),
    ('--btn-secondary-hover', 'colors', 'color', 'rgba(255, 255, 255, 0.15)', 'rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.15)', 'Secondary button hover background', true);

-- Toggle Color Tokens
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--toggle-bg-off', 'colors', 'color', 'rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)', 'Toggle switch background when off', true),
    ('--toggle-bg-on', 'colors', 'color', 'linear-gradient(81deg, #ce1bfb 10.86%, #35e6cc 89.96%)', 'linear-gradient(81deg, #1d4ed8 10.86%, #3b82f6 89.96%)', 'linear-gradient(81deg, #ce1bfb 10.86%, #35e6cc 89.96%)', 'Toggle switch background when on', true),
    ('--toggle-handle', 'colors', 'color', '#ffffff', '#ffffff', '#ffffff', 'Toggle switch handle color', true);

-- Spacing Tokens
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--sidebar-width', 'spacing', 'size', '260px', '260px', '260px', 'Sidebar width', true);

-- Typography Tokens
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--font-family', 'typography', 'font', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', '''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif', 'Primary font family', true);

-- Draft Status Bar Color Tokens
INSERT INTO css_tokens (token_name, token_category, token_type, default_value, light_mode_value, dark_mode_value, description, is_customizable)
VALUES 
    ('--draft-status-bg', 'colors', 'gradient', 'linear-gradient(90deg, var(--warning), var(--secondary))', 'linear-gradient(90deg, var(--warning), var(--secondary))', 'linear-gradient(90deg, var(--warning), var(--secondary))', 'Draft status bar background gradient', true),
    ('--draft-status-text', 'colors', 'color', '#ffffff', '#ffffff', '#ffffff', 'Draft status bar text color', true),
    ('--draft-status-icon', 'colors', 'color', '#ffffff', '#ffffff', '#ffffff', 'Draft status bar icon color', true),
    ('--draft-status-muted', 'colors', 'color', 'rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.9)', 'Draft status bar muted text color', true),
    ('--draft-count-bg', 'colors', 'color', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.2)', 'Draft count badge background', true),
    ('--draft-count-text', 'colors', 'color', '#ffffff', '#ffffff', '#ffffff', 'Draft count badge text color', true);

-- ===============================================
-- SEED DATA: CSS Gradients
-- ===============================================
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
    ('linear9', 'linear-gradient(41deg, #00BAD4 7.72%, #2194FF 55.76%, #A05DFE 93.63%)', 'linear', 'Multi-color gradient - Cyan to Blue to Purple', true);

-- ===============================================
-- SEED DATA: Initial Theme Version
-- ===============================================
INSERT INTO theme_versions (version_name, version_number, status, is_active, description, published_at)
VALUES 
    ('Default Theme v1.0', 1, 'published', true, 'Initial production theme with gradient system', CURRENT_TIMESTAMP);

-- ===============================================
-- SEED DATA: CSS Backup Metadata
-- ===============================================
INSERT INTO css_backups (backup_name, backup_date, total_files, location, purpose, notes)
VALUES 
    ('complete-css-backup-2026-01-20', '2026-01-20', 13, 'packages/frontend/styles/', 'Backup and reference for all CSS styling in the admin application', 'This is a backup copy - do not modify original CSS files');
