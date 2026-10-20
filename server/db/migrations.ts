// Schema migrations. Each entry runs exactly once, in order, and is recorded in schema_migrations.
// Never edit a migration that has already been deployed — append a new one instead.

export const migrations: { id: string; sql: string }[] = [
  {
    id: '001_initial_schema',
    sql: `
      CREATE TABLE users (
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
      CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
      CREATE UNIQUE INDEX users_student_id_unique ON users (lower(student_id));

      CREATE TABLE groups (
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
      CREATE UNIQUE INDEX groups_code_unique ON groups (upper(code));

      CREATE TABLE group_members (
        group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (group_id, user_id)
      );
      CREATE INDEX group_members_user_idx ON group_members (user_id);

      CREATE TABLE tasks (
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
      CREATE INDEX tasks_group_idx ON tasks (group_id);

      CREATE TABLE daily_logs (
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
      CREATE INDEX daily_logs_group_idx ON daily_logs (group_id, created_at DESC);

      CREATE TABLE daily_log_reactions (
        log_id     UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji      TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (log_id, user_id, emoji)
      );

      CREATE TABLE activity_events (
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
      CREATE INDEX activity_events_group_idx ON activity_events (group_id, created_at DESC);
    `,
  },
];
