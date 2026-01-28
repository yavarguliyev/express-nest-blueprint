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
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('global admin', 'admin', 'user', 'moderator')),
    last_login TIMESTAMP WITH TIME ZONE,
    is_email_verified BOOLEAN DEFAULT false,
    profile_image_url VARCHAR(255)
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
INSERT INTO users (email, first_name, last_name, is_active, is_email_verified, role, password_hash) VALUES
    ('guliyev.yavar@example.com', 'Yavar', 'Guliyev', true, true, 'global admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('john.doe@example.com', 'John', 'Doe', true, true, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('jane.smith@example.com', 'Jane', 'Smith', true, true, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('bob.johnson@example.com', 'Bob', 'Johnson', true, true, 'admin', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('alice.wilson@example.com', 'Alice', 'Wilson', true, true, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('michael.brown@example.com', 'Michael', 'Brown', true, true, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('emily.davis@example.com', 'Emily', 'Davis', true, true, 'moderator', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('daniel.miller@example.com', 'Daniel', 'Miller', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('sophia.moore@example.com', 'Sophia', 'Moore', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('william.taylor@example.com', 'William', 'Taylor', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('olivia.anderson@example.com', 'Olivia', 'Anderson', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('james.thomas@example.com', 'James', 'Thomas', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('charlotte.jackson@example.com', 'Charlotte', 'Jackson', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG'),
    ('henry.white@example.com', 'Henry', 'White', true, true, 'user', '$2b$12$XfD0o9PAD8ji4foBV2YRy.PR4/s0f0QHRIFUUylndRMHq1bUAhcwG')
ON CONFLICT (email) DO NOTHING;


-- Ensure existing rows have default role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create pgmigrations table and mark migrations as done
CREATE TABLE IF NOT EXISTS pgmigrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    run_on TIMESTAMP NOT NULL
);

INSERT INTO pgmigrations (name, run_on) VALUES 
    ('1768287339787_initial-schema', NOW()),
    ('1768477051349_add-profile-fields-to-users', NOW());
