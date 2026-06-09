-- ============================================================
-- PORTAL DE APROVAÇÃO DE POSTS — Row Level Security Policies
-- ============================================================

-- ── Helper: is_admin ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Helper: is_admin_or_social_media ─────────────────────────
CREATE OR REPLACE FUNCTION is_admin_or_sm()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin')
  );
$$;

-- ── Helper: has_client_access ─────────────────────────────────
CREATE OR REPLACE FUNCTION has_client_access(p_client_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM client_users
      WHERE client_id = p_client_id AND user_id = auth.uid()
    )
  );
$$;

-- ── PROFILES ──────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: leitura propria" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles: update proprio" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles: admin pode tudo" ON profiles
  FOR ALL USING (is_admin());

-- ── CLIENTS ───────────────────────────────────────────────────
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: admin gerencia" ON clients
  FOR ALL USING (is_admin());

CREATE POLICY "clients: usuarios vinculados podem ver" ON clients
  FOR SELECT USING (has_client_access(id));

-- ── CLIENT_USERS ──────────────────────────────────────────────
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_users: admin gerencia" ON client_users
  FOR ALL USING (is_admin());

CREATE POLICY "client_users: user ve seus vinculos" ON client_users
  FOR SELECT USING (user_id = auth.uid());

-- ── POSTS ─────────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts: admin ve todos" ON posts
  FOR ALL USING (is_admin());

CREATE POLICY "posts: cliente ve seus posts" ON posts
  FOR SELECT USING (has_client_access(client_id));

-- ── POST_VERSIONS ─────────────────────────────────────────────
ALTER TABLE post_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_versions: admin gerencia" ON post_versions
  FOR ALL USING (is_admin());

CREATE POLICY "post_versions: cliente le suas versoes" ON post_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND has_client_access(p.client_id)
    )
  );

-- ── POST_FILES ────────────────────────────────────────────────
ALTER TABLE post_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_files: admin gerencia" ON post_files
  FOR ALL USING (is_admin());

CREATE POLICY "post_files: cliente le seus arquivos" ON post_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND has_client_access(p.client_id)
    )
  );

-- ── COMMENTS ─────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments: admin gerencia" ON comments
  FOR ALL USING (is_admin());

CREATE POLICY "comments: usuario vinculado le" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND has_client_access(p.client_id)
    )
  );

CREATE POLICY "comments: cliente e admin inserem" ON comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      JOIN client_users cu ON cu.client_id = p.client_id
      WHERE p.id = post_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('admin', 'client')
    )
  );

CREATE POLICY "comments: usuario edita proprio" ON comments
  FOR UPDATE USING (user_id = auth.uid() AND NOT is_deleted);

CREATE POLICY "comments: usuario deleta proprio" ON comments
  FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ── APPROVALS ─────────────────────────────────────────────────
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals: admin ve tudo" ON approvals
  FOR ALL USING (is_admin());

CREATE POLICY "approvals: cliente aprova seus posts" ON approvals
  FOR INSERT WITH CHECK (
    approved_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      JOIN client_users cu ON cu.client_id = p.client_id
      WHERE p.id = post_id
        AND cu.user_id = auth.uid()
        AND cu.role = 'client'
        AND p.status IN ('enviado_aprovacao', 'aguardando_cliente', 'reenviado_aprovacao')
    )
  );

CREATE POLICY "approvals: vinculados leem" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND has_client_access(p.client_id)
    )
  );

-- ── ACTION_LOGS ───────────────────────────────────────────────
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_logs: admin le tudo" ON action_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "action_logs: cliente le seus" ON action_logs
  FOR SELECT USING (
    entity = 'post'
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = entity_id AND has_client_access(p.client_id)
    )
  );

CREATE POLICY "action_logs: sistema insere" ON action_logs
  FOR INSERT WITH CHECK (true);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: usuario ve as suas" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications: usuario atualiza as suas" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications: sistema insere" ON notifications
  FOR INSERT WITH CHECK (true);
