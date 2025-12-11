-- There are two tables here users and user_profiles

--users table vs user_profiles view:
-- users (Table) - Complete Data

-- This is the actual database table that stores ALL user information
-- Contains sensitive data like password_hash
-- Should only be accessed by your backend/server
-- Used for authentication and internal operations

-- user_profiles (View) - Safe Public Data

-- This is a virtual view (not a real table) that shows a filtered version of the users table
-- Excludes sensitive data like password_hash
-- Safe to expose to frontend or other users
-- Used when you need to display user information without security risks

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Add constraint to ensure email is lowercase and valid format
ALTER TABLE users ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own data
CREATE POLICY "Users can view own data" 
    ON users 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data" 
    ON users 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Optional: Create a view for safe user data (without password_hash)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    user_id,
    name,
    email,
    created_at,
    updated_at,
    last_login,
    is_active,
    email_verified
FROM users;

-- Grant permissions
GRANT SELECT ON user_profiles TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main users table for authentication';
COMMENT ON COLUMN users.user_id IS 'Primary key - UUID for user identification';
COMMENT ON COLUMN users.name IS 'User full name';
COMMENT ON COLUMN users.email IS 'User email address - unique and used for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user account was last updated';
COMMENT ON COLUMN users.last_login IS 'Timestamp of user last successful login';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email';
