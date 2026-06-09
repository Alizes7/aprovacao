-- ============================================================
-- STORAGE: Buckets e Políticas
-- Execute no Supabase Dashboard → Storage → (após criar buckets)
-- ou via SQL Editor
-- ============================================================

-- ── 1. Criar Buckets ──────────────────────────────────────────
-- Crie manualmente no Dashboard ou via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'post-files',
    'post-files',
    true,
    52428800, -- 50MB
    ARRAY['image/png','image/jpg','image/jpeg','image/webp','application/pdf','video/mp4']
  ),
  (
    'logos',
    'logos',
    true,
    5242880, -- 5MB
    ARRAY['image/png','image/jpg','image/jpeg','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. Políticas do bucket post-files ─────────────────────────

-- Qualquer usuário autenticado pode fazer upload
CREATE POLICY "post-files: upload autenticado"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-files');

-- Qualquer pessoa pode ler (URL pública)
CREATE POLICY "post-files: leitura publica"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-files');

-- Somente o uploader ou admin pode deletar
CREATE POLICY "post-files: delete proprio ou admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ── 3. Políticas do bucket logos ──────────────────────────────

CREATE POLICY "logos: upload admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "logos: leitura publica"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');

CREATE POLICY "logos: update admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
