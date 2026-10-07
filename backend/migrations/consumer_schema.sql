-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customers (Changed to lowercase for consistency)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,   
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status smallint
);

-- 4. Videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_seconds INTEGER NOT NULL,
    stream_url TEXT NOT NULL,
    thumbnail_url TEXT,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Project Videos (Junction)
CREATE TABLE project_videos (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    PRIMARY KEY (project_id, video_id)
);

-- 7. Project Access Keys
CREATE TABLE project_access_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_code VARCHAR(100) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'guest',
    expires_at TIMESTAMPTZ,
    max_views INTEGER
);

CREATE UNIQUE INDEX ix_project_access_keys_token_code ON project_access_keys(token_code);

-- 8. Video Watch Logs (Fixed reference to customers)
CREATE TABLE video_watch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watch_time_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_video_watch_logs_customer_video ON video_watch_logs(customer_id, video_id);
CREATE INDEX ix_video_watch_logs_project_id ON video_watch_logs(project_id);