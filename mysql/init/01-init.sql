-- Initialize the database with proper settings
CREATE DATABASE IF NOT EXISTS logsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'tasktracker_user'@'%' IDENTIFIED BY 'tasktracker_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON logsdb.* TO 'tasktracker_user'@'%';
GRANT ALL PRIVILEGES ON logsdb.* TO 'root'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Use the database
USE logsdb;

-- Create tables if they don't exist (these will be created by Entity Framework migrations)
-- This is just a placeholder to ensure the database is ready
SELECT 'Database initialized successfully' as status;
