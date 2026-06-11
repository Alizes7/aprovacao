-- ============================================================
-- MIGRATION: Workspaces + Roles granulares
-- Rodar no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Atualizar enum de roles
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'social_media', 'client', 'viewer'));

-- Migrar roles antigos para os novos
UPDATE profiles SET role = 'social_media' WHERE role NOT IN ('admin', 'social_media', 'client', 'viewer');

-- 2. Criar tabela de workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspaces_client_id_idx ON workspaces(client_id);

-- 3. Criar tabela de membros do workspace
CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin', 'social_media', 'client', 'viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx ON workspace_members(workspace_id);

-- 4. RLS para workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workspace_members WHERE workspace_id = workspaces.id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'social_media')
    )
  );

CREATE POLICY "workspaces_insert_admin" ON workspaces FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. RLS para workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select" ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'social_media')
    )
  );

CREATE POLICY "workspace_members_manage_admin" ON workspace_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Criar workspaces para clientes existentes (executar uma vez)
INSERT INTO workspaces (client_id, name, slug)
SELECT
  c.id,
  c.name,
  LOWER(REGEXP_REPLACE(UNACCENT(c.name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || LEFT(c.id::TEXT, 6)
FROM clients c
WHERE c.is_active = true
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.client_id = c.id)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- RESUMO DO QUE FOI CRIADO:
-- - tabela workspaces (um por cliente)
-- - tabela workspace_members (usuários por workspace com role)
-- - RLS: admin/social_media veem tudo, client/viewer só seu workspace
-- ============================================================
