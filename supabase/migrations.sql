-- ============================================================
-- MIGRATION: Workspaces + Roles + Notificações de comentário
-- Rodar no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela de workspaces (um por cliente)
CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Membros de cada workspace
CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 3. Atualizar ENUM de role para incluir social_media
-- (se a coluna role em profiles for TEXT, só atualiza os valores)
-- Se for ENUM, rodar:
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'social_media';

-- 4. Criar workspace automaticamente ao inserir um cliente
CREATE OR REPLACE FUNCTION create_workspace_for_client()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  slug_base TEXT;
  final_slug TEXT;
BEGIN
  slug_base := lower(regexp_replace(
    translate(NEW.name,
      'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  final_slug := slug_base || '-' || substring(NEW.id::text, 1, 6);

  INSERT INTO workspaces (client_id, name, slug, is_active)
  VALUES (NEW.id, NEW.name, final_slug, true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_workspace ON clients;
CREATE TRIGGER trg_create_workspace
  AFTER INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION create_workspace_for_client();

-- 5. Criar workspaces para clientes que já existem
INSERT INTO workspaces (client_id, name, slug, is_active)
SELECT
  id,
  name,
  lower(
    regexp_replace(
      translate(name,
        'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  ) || '-' || substring(id::text, 1, 6),
  true
FROM clients
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- 6. Function para notificar admins/social_media quando cliente comenta
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  commenter RECORD;
  post_rec  RECORD;
  recipient RECORD;
  notif_type TEXT;
  notif_title TEXT;
  notif_msg TEXT;
BEGIN
  -- Busca o perfil de quem comentou
  SELECT * INTO commenter FROM profiles WHERE id = NEW.user_id;
  -- Busca o post
  SELECT p.*, c.name AS client_name
    INTO post_rec
    FROM posts p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.id = NEW.post_id;

  -- Se for cliente comentando → notifica admins e social_media
  IF commenter.role IN ('client', 'viewer') THEN
    notif_type  := 'cliente_comentou';
    notif_title := '💬 Cliente comentou';
    notif_msg   := commenter.full_name || ' comentou no post "' || post_rec.title || '"';

    FOR recipient IN
      SELECT id FROM profiles WHERE role IN ('admin', 'social_media') AND is_active = true AND id != NEW.user_id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, post_id)
      VALUES (recipient.id, notif_title, notif_msg, notif_type, NEW.post_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.is_system = false)
  EXECUTE FUNCTION notify_on_comment();

-- 7. RLS: workspace_members visível para membros e admins
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON workspaces FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
    OR
    EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid())
  );

CREATE POLICY "workspace_members_select" ON workspace_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
    OR user_id = auth.uid()
  );

CREATE POLICY "workspace_members_insert" ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "workspace_members_delete" ON workspace_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Habilitar Realtime nas tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
