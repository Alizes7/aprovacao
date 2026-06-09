-- ============================================================
-- PORTAL DE APROVAÇÃO DE POSTS — Seeds de Exemplo
-- ATENÇÃO: Execute após criar os usuários via Supabase Auth
-- Substitua os UUIDs pelos IDs reais dos usuários criados
-- ============================================================

-- Exemplo de inserção manual de perfis (normalmente feito via trigger)
-- Se precisar inserir manualmente:
-- INSERT INTO profiles (id, email, full_name, role) VALUES
--   ('UUID_DO_ADMIN', 'admin@agencia.com', 'Admin Social Media', 'admin'),
--   ('UUID_DO_CLIENTE', 'cliente@empresa.com', 'João Silva', 'client'),
--   ('UUID_DO_VIEWER', 'viewer@empresa.com', 'Maria Oliveira', 'viewer');

-- Clientes de exemplo (execute após ter um admin autenticado)
INSERT INTO clients (name, segment, responsible, email, phone, primary_color, notes) VALUES
  ('Rei do Mate', 'Alimentação', 'Carlos Mendes', 'carlos@reidomate.com.br', '(11) 99999-0001', '#4CAF50', 'Maior rede de mate do Brasil'),
  ('DRC Advogados', 'Advocacia', 'Dra. Regina Costa', 'regina@drcadvogados.com.br', '(11) 98888-0002', '#1C3A5A', 'Especialistas em direito empresarial'),
  ('Accost Logística', 'Logística Internacional', 'Pedro Accost', 'pedro@accost.com.br', '(11) 97777-0003', '#E07830', 'Logística para importação e exportação');

-- Nota: Posts são criados via aplicação, pois o trigger cria versão 1 automaticamente
-- Para testar o schema, você pode inserir posts manualmente substituindo client_id
-- e created_by pelos UUIDs reais.
