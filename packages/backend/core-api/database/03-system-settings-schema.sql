-- ===============================================
-- SYSTEM SETTINGS TABLE
-- ===============================================
-- This table stores system-wide configuration settings
-- that can be dynamically changed without restarting the application

-- Create the table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value BOOLEAN NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_active ON system_settings(is_active);

-- Create trigger (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Drop trigger if exists
        DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
        
        -- Create trigger
        CREATE TRIGGER update_system_settings_updated_at 
            BEFORE UPDATE ON system_settings 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Trigger created successfully';
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found, skipping trigger creation';
    END IF;
END $$;

-- Insert default data
INSERT INTO system_settings (key, value, category, description) VALUES
    ('maintenance_mode', false, 'System', 'Disable public access to the API'),
    ('debug_logging', true, 'System', 'Enable verbose logging for all requests'),
    ('allow_registration', true, 'Security', 'Enable/disable new user signups'),
    ('enforce_mfa', false, 'Security', 'Require Multi-Factor Authentication for all users')
ON CONFLICT (key) DO NOTHING;

-- Mark migration as completed
INSERT INTO pgmigrations (name, run_on) VALUES 
    ('1768979350000_add-system-settings-table', NOW())
ON CONFLICT (name) DO NOTHING;
