-- =============================================================================
-- LeaderSync - PostgreSQL & pgAdmin 4 Database Initialization Script
-- =============================================================================
--
-- HOW TO USE WITH PGADMIN 4:
-- 1. Open pgAdmin 4 and connect to your PostgreSQL server.
-- 2. Right-click on "Databases" -> "Create" -> "Database..."
--    - Database name: leadersync_db
--    - Click "Save"
-- 3. Right-click on "leadersync_db" -> "Query Tool".
-- 4. Open or copy-paste the entire contents of this file into the Query Editor.
-- 5. Click the "Execute" button (or press F5).
-- 6. In your LeaderSync project root, set the following in your .env file:
--    DATABASE_URL=postgresql://postgres:your_password@localhost:5432/leadersync_db
--    DATABASE_SSL=false
-- 7. Start your server: npm run dev
--    The app will connect directly to your PostgreSQL database!
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- Stores all team members, leaders, and super admins.
-- The very first user to register automatically becomes 'super_admin'.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_km       TEXT,
  email         TEXT NOT NULL,
  student_id    TEXT NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('super_admin', 'team_lead', 'member', 'viewer')),
  specialty     TEXT,
  department    TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_student_id_unique ON users (lower(student_id));

COMMENT ON TABLE users IS 'User profiles and credentials. First registered user is granted super_admin role.';
COMMENT ON COLUMN users.role IS 'super_admin, team_lead, member, or viewer';

-- -----------------------------------------------------------------------------
-- 2. Table: groups
-- Collaborative team workspaces created by Super Admins or Leaders.
-- Each group has a unique human-friendly code (e.g. GRP-101) and a UUID.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  name_km           TEXT,
  code              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  course_or_project TEXT NOT NULL DEFAULT '',
  leader_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline          DATE,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'archived')),
  category          TEXT NOT NULL DEFAULT 'assignment'
                    CHECK (category IN ('assignment', 'research', 'startup', 'other')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS groups_code_unique ON groups (upper(code));

COMMENT ON TABLE groups IS 'Teams and student groups for collaborative project management.';
COMMENT ON COLUMN groups.code IS 'Shareable code (e.g. GRP-101) allowing members to join directly.';

-- -----------------------------------------------------------------------------
-- 3. Table: group_members
-- Maps users to their joined groups.
-- Members can be invited by Admin OR self-joined with Group Code / ID.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members (user_id);

-- -----------------------------------------------------------------------------
-- 4. Table: tasks
-- Tasks assigned with deadline, priority, module, status, and verification.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  module          TEXT NOT NULL DEFAULT 'General',
  description     TEXT NOT NULL DEFAULT '',
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo', 'in_progress', 'ready_for_review', 'approved')),
  due_date        DATE NOT NULL,
  due_time        TEXT,
  member_notes    TEXT,
  leader_feedback TEXT,
  completed_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_group_idx ON tasks (group_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks (assigned_to);

-- -----------------------------------------------------------------------------
-- 5. Table: daily_logs
-- Daily ToDo standup submissions from team members.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date       DATE NOT NULL,
  title          TEXT NOT NULL,
  raw_content    TEXT NOT NULL,
  items          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status         TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'completed', 'approved')),
  completed_at   TIMESTAMPTZ,
  leader_checked BOOLEAN NOT NULL DEFAULT false,
  leader_note    TEXT,
  approved_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_logs_group_idx ON daily_logs (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs (user_id, log_date);

-- -----------------------------------------------------------------------------
-- 6. Table: daily_log_reactions
-- Peer reactions (emojis) on daily standups.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_log_reactions (
  log_id     UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (log_id, user_id, emoji)
);

-- -----------------------------------------------------------------------------
-- 7. Table: activity_events
-- Audit trail and real-time team activity feed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  actor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name     TEXT NOT NULL,
  target_id      TEXT,
  target_title   TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL,
  description_km TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_events_group_idx ON activity_events (group_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. Table: schema_migrations
-- Tracks migrations applied by the LeaderSync backend.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (id) VALUES ('001_initial_schema')
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT 'Database schema created successfully for LeaderSync!' AS status;
