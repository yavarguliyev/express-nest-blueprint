-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    last_login TIMESTAMP WITH TIME ZONE,
    is_email_verified BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(is_email_verified);

-- Trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data with password_hash
INSERT INTO users (email, first_name, last_name, is_active, role, password_hash) VALUES
    ('john.doe@example.com', 'John', 'Doe', true, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('jane.smith@example.com', 'Jane', 'Smith', true, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('bob.johnson@example.com', 'Bob', 'Johnson', false, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG')
ON CONFLICT (email) DO NOTHING;

-- Ensure existing rows have default role
UPDATE users SET role = 'user' WHERE role IS NULL;
