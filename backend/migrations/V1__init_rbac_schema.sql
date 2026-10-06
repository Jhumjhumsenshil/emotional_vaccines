-- Up Migration: Init RBAC Schema
BEGIN;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Create Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Create User Roles Junction Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. Create Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed Permissions (Idempotent using ON CONFLICT)
INSERT INTO permissions (slug, description) VALUES
    ('users:read', 'Can view user details and list'),
    ('users:write', 'Can create and edit user profiles'),
    ('users:delete', 'Can delete users'),
    ('roles:manage', 'Can create, edit, and assign roles')
ON CONFLICT (slug) DO NOTHING;

-- Seed Default Roles
INSERT INTO roles (name, description) VALUES
    ('Super Admin', 'Full access to all system resources'),
    ('Manager', 'Can read and edit users, but cannot manage roles')
ON CONFLICT (name) DO NOTHING;

-- Assign Permissions to Super Admin (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Assign Permissions to Manager (users:read, users:write)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Manager' AND p.slug IN ('users:read', 'users:write')
ON CONFLICT DO NOTHING;

COMMIT;