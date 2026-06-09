-- ============================================================
-- PORTAL DE APROVAÇÃO DE POSTS — Schema Completo
-- Supabase / PostgreSQL
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'client', 'viewer');

CREATE TYPE post_format AS ENUM (
  'post_unico', 'carrossel', 'story', 'reels', 'video', 'capa', 'banner', 'outro'
);

CREATE TYPE social_network AS ENUM (
  'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube_shorts', 'outra'
);

CREATE TYPE post_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

CREATE TYPE post_status AS ENUM (
  'rascunho',
  'enviado_aprovacao',
  'aguardando_cliente',
  'ajustes_solicitados',
  'em_ajuste',
  'reenviado_aprovacao',
  'aprovado',
  'publicado',
  'arquivado'
);

CREATE TYPE version_status AS ENUM (
  'rascunho',
  'enviado',
  'ajustes_solicitados',
  'aprovado',
  'arquivado'
);

CREATE TYPE notification_type AS ENUM (
  'post_enviado_aprovacao',
  'cliente_comentou',
  'ajuste_solicitado',
  'post_aprovado',
  'prazo_proximo',
  'prazo_vencido',
  'nova_versao_enviada',
  'post_publicado'
);

CREATE TYPE action_type AS ENUM (
  'post_criado',
  'post_editado',
  'post_excluido',
  'arquivo_enviado',
  'arquivo_excluido',
  'post_enviado_aprovacao',
  'comentario_criado',
  'ajuste_solicitado',
  'nova_versao_enviada',
  'conteudo_aprovado',
  'post_publicado',
  'post_arquivado',
  'status_alterado',
  'cliente_criado',
  'cliente_editado',
  'cliente_excluido'
);

-- ── PROFILES (extends auth.users) ───────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'viewer',
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLIENTS ─────────────────────────────────────────────────

CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  segment       TEXT,
  responsible   TEXT,
  email         TEXT,
  phone         TEXT,
  notes         TEXT,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients USING gin(name gin_trgm_ops);
CREATE INDEX idx_clients_segment ON clients(segment);
CREATE INDEX idx_clients_is_active ON clients(is_active);

-- ── CLIENT_USERS (M:N — quais usuários têm acesso a qual cliente) ──

CREATE TABLE client_users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

CREATE INDEX idx_client_users_client ON client_users(client_id);
CREATE INDEX idx_client_users_user   ON client_users(user_id);

-- ── POSTS ────────────────────────────────────────────────────

CREATE TABLE posts (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  format               post_format NOT NULL DEFAULT 'post_unico',
  social_network       social_network NOT NULL DEFAULT 'instagram',
  scheduled_date       DATE,
  approval_deadline    TIMESTAMPTZ,
  responsible_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority             post_priority NOT NULL DEFAULT 'media',
  caption              TEXT,
  hashtags             TEXT,
  cta                  TEXT,
  notes                TEXT,
  status               post_status NOT NULL DEFAULT 'rascunho',
  current_version_num  INTEGER NOT NULL DEFAULT 1,
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_client       ON posts(client_id);
CREATE INDEX idx_posts_status       ON posts(status);
CREATE INDEX idx_posts_format       ON posts(format);
CREATE INDEX idx_posts_social       ON posts(social_network);
CREATE INDEX idx_posts_priority     ON posts(priority);
CREATE INDEX idx_posts_deadline     ON posts(approval_deadline);
CREATE INDEX idx_posts_scheduled    ON posts(scheduled_date);
CREATE INDEX idx_posts_responsible  ON posts(responsible_id);
CREATE INDEX idx_posts_created_by   ON posts(created_by);

-- ── POST_VERSIONS ────────────────────────────────────────────

CREATE TABLE post_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_num INTEGER NOT NULL DEFAULT 1,
  caption     TEXT,
  hashtags    TEXT,
  cta         TEXT,
  notes       TEXT,
  status      version_status NOT NULL DEFAULT 'rascunho',
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, version_num)
);

CREATE INDEX idx_post_versions_post ON post_versions(post_id);

-- ── POST_FILES ────────────────────────────────────────────────

CREATE TABLE post_files (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_id     UUID REFERENCES post_versions(id) ON DELETE SET NULL,
  original_name  TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  public_url     TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL DEFAULT 0,
  carousel_order INTEGER DEFAULT 0,
  uploaded_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_files_post    ON post_files(post_id);
CREATE INDEX idx_post_files_version ON post_files(version_id);

-- ── COMMENTS ─────────────────────────────────────────────────

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_id  UUID REFERENCES post_versions(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_system   BOOLEAN NOT NULL DEFAULT false,
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post     ON comments(post_id);
CREATE INDEX idx_comments_version  ON comments(version_id);
CREATE INDEX idx_comments_user     ON comments(user_id);
CREATE INDEX idx_comments_parent   ON comments(parent_id);

-- ── APPROVALS ────────────────────────────────────────────────

CREATE TABLE approvals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  version_id    UUID NOT NULL REFERENCES post_versions(id) ON DELETE CASCADE,
  approved_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT,
  UNIQUE(post_id, version_id)
);

CREATE INDEX idx_approvals_post    ON approvals(post_id);
CREATE INDEX idx_approvals_version ON approvals(version_id);

-- ── ACTION_LOGS ───────────────────────────────────────────────

CREATE TABLE action_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity      TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  action      action_type NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_logs_entity    ON action_logs(entity, entity_id);
CREATE INDEX idx_action_logs_user      ON action_logs(user_id);
CREATE INDEX idx_action_logs_action    ON action_logs(action);
CREATE INDEX idx_action_logs_created   ON action_logs(created_at DESC);

-- ── NOTIFICATIONS ─────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        notification_type NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  post_id     UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_post    ON notifications(post_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ── TRIGGERS: updated_at ──────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── TRIGGER: criar versão 1 ao criar post ────────────────────

CREATE OR REPLACE FUNCTION create_initial_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO post_versions (post_id, version_num, caption, hashtags, cta, notes, created_by)
  VALUES (NEW.id, 1, NEW.caption, NEW.hashtags, NEW.cta, NEW.notes, NEW.created_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_create_version
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION create_initial_version();

-- ── TRIGGER: criar perfil ao registrar usuário ────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
