-- Migration V2: Add status and additional roles
BEGIN;

-- 1. Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- 2. Add roles requested: Administrator, Content Manager, Report Viewer
INSERT INTO roles (name, description) VALUES
    ('Administrator', 'Administrative access and user management'),
    ('Content Manager', 'Can manage and publish video content'),
    ('Report Viewer', 'Can view analytics and reports')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign permissions to Administrator (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Administrator'
ON CONFLICT DO NOTHING;

-- 4. Assign permissions to Content Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Content Manager' AND p.slug IN ('users:read', 'users:write')
ON CONFLICT DO NOTHING;

-- 5. Assign permissions to Report Viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Report Viewer' AND p.slug IN ('users:read')
ON CONFLICT DO NOTHING;

-- 6. Ensure users with assigned roles are marked approved
UPDATE users SET status = 'approved' 
WHERE id IN (SELECT user_id FROM user_roles);

-- 7. Ensure demo admin and manager are approved
UPDATE users SET status = 'approved' WHERE username IN ('admin', 'manager');

COMMIT;
