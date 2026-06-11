-- ============================================================
-- RLS: Filtro de posts por workspace para client/viewer
-- Rodar no Supabase Dashboard > SQL Editor
-- ============================================================

-- Habilitar RLS na tabela posts (se ainda não estiver)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "posts_workspace_select" ON posts;

-- Policy: admin e social_media veem tudo
-- client e viewer veem só posts dos clientes do seu workspace
CREATE POLICY "posts_workspace_select" ON posts
  FOR SELECT
  USING (
    -- admin e social_media: acesso total
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'social_media')
    )
    OR
    -- client/viewer: só posts dos clientes do workspace deles
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('client', 'viewer')
      )
      AND client_id IN (
        SELECT w.client_id
        FROM workspace_members wm
        JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = auth.uid()
      )
      -- client não vê rascunhos
      AND (
        status != 'rascunho'
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'viewer'
        )
      )
    )
  );

-- Policy INSERT: só admin e social_media criam posts
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'social_media')
    )
  );

-- Policy UPDATE: admin e social_media atualizam
-- client pode atualizar só para aprovar/solicitar ajuste (via server action com validação)
DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'social_media')
    )
    OR
    -- client pode fazer update apenas em posts do próprio workspace
    (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client'
      )
      AND client_id IN (
        SELECT w.client_id FROM workspace_members wm
        JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = auth.uid()
      )
    )
  );

-- Policy DELETE: só admin
DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================
-- RLS: Comentários por workspace
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
    OR
    post_id IN (
      SELECT p.id FROM posts p
      JOIN workspace_members wm ON wm.workspace_id IN (
        SELECT id FROM workspaces WHERE client_id = p.client_id
      )
      WHERE wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments
  FOR INSERT
  WITH CHECK (
    -- admin e social_media comentam em qualquer post
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
    OR
    -- client comenta só em posts do próprio workspace
    (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client')
      AND post_id IN (
        SELECT p.id FROM posts p
        JOIN workspaces w ON w.client_id = p.client_id
        JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RLS: Notificações — cada usuário só vê as suas
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- RLS: Arquivos de post (post_files) — mesmo escopo dos posts
-- ============================================================
ALTER TABLE post_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_files_select" ON post_files;
CREATE POLICY "post_files_select" ON post_files
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
    OR
    post_id IN (
      SELECT p.id FROM posts p
      JOIN workspaces w ON w.client_id = p.client_id
      JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "post_files_insert" ON post_files;
CREATE POLICY "post_files_insert" ON post_files
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','social_media'))
  );
