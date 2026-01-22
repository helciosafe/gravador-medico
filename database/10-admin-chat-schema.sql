-- ================================================================
-- SCHEMA: Chat Interno entre Administradores
-- ================================================================

-- Tabela de conversas/threads do chat interno
CREATE TABLE IF NOT EXISTS admin_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de conversa
  type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' | 'group'
  name VARCHAR(255), -- Nome do grupo (se type='group')
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Última mensagem (denormalizado para performance)
  last_message_content TEXT,
  last_message_timestamp TIMESTAMPTZ,
  last_message_from UUID REFERENCES users(id)
);

-- Tabela de participantes (N:N entre conversas e usuários)
CREATE TABLE IF NOT EXISTS admin_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES admin_chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Controle de leitura
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ,
  
  -- Metadata
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: um usuário não pode participar 2x da mesma conversa
  UNIQUE(conversation_id, user_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES admin_chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  
  -- Conteúdo
  content TEXT,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'file'
  media_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Reply (mensagem respondendo outra)
  reply_to UUID REFERENCES admin_chat_messages(id)
);

-- ================================================================
-- ÍNDICES para performance
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_conversation 
  ON admin_chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_chat_participants_user 
  ON admin_chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_chat_participants_conversation 
  ON admin_chat_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_admin_chat_conversations_updated 
  ON admin_chat_conversations(updated_at DESC);

-- ================================================================
-- TRIGGERS para manter dados atualizados
-- ================================================================

-- Trigger: Atualizar conversation.updated_at quando nova mensagem
CREATE OR REPLACE FUNCTION update_admin_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE admin_chat_conversations
  SET 
    updated_at = NOW(),
    last_message_content = NEW.content,
    last_message_timestamp = NEW.created_at,
    last_message_from = NEW.sender_id
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_admin_chat_conversation ON admin_chat_messages;
CREATE TRIGGER trg_update_admin_chat_conversation
  AFTER INSERT ON admin_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_chat_conversation_timestamp();

-- Trigger: Incrementar unread_count para outros participantes
CREATE OR REPLACE FUNCTION increment_admin_chat_unread()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementa unread_count para todos os participantes EXCETO o sender
  UPDATE admin_chat_participants
  SET unread_count = unread_count + 1
  WHERE 
    conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_admin_chat_unread ON admin_chat_messages;
CREATE TRIGGER trg_increment_admin_chat_unread
  AFTER INSERT ON admin_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_admin_chat_unread();

-- ================================================================
-- VIEW: Conversas com dados completos
-- ================================================================

CREATE OR REPLACE VIEW admin_chat_conversations_full AS
SELECT 
  c.*,
  COUNT(DISTINCT p.user_id) as participant_count,
  ARRAY_AGG(DISTINCT p.user_id) as participant_ids,
  COUNT(DISTINCT m.id) as message_count
FROM admin_chat_conversations c
LEFT JOIN admin_chat_participants p ON p.conversation_id = c.id
LEFT JOIN admin_chat_messages m ON m.conversation_id = c.id AND m.deleted_at IS NULL
GROUP BY c.id;

-- ================================================================
-- FUNÇÃO: Criar conversa direta entre 2 usuários
-- ================================================================

CREATE OR REPLACE FUNCTION create_direct_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  existing_conv UUID;
BEGIN
  -- Verificar se já existe conversa direta entre os 2
  SELECT c.id INTO existing_conv
  FROM admin_chat_conversations c
  INNER JOIN admin_chat_participants p1 ON p1.conversation_id = c.id AND p1.user_id = user1_id
  INNER JOIN admin_chat_participants p2 ON p2.conversation_id = c.id AND p2.user_id = user2_id
  WHERE c.type = 'direct'
  LIMIT 1;
  
  IF existing_conv IS NOT NULL THEN
    RETURN existing_conv;
  END IF;
  
  -- Criar nova conversa
  INSERT INTO admin_chat_conversations (type, created_by)
  VALUES ('direct', user1_id)
  RETURNING id INTO conversation_id;
  
  -- Adicionar ambos participantes
  INSERT INTO admin_chat_participants (conversation_id, user_id)
  VALUES 
    (conversation_id, user1_id),
    (conversation_id, user2_id);
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- FUNÇÃO: Marcar conversa como lida
-- ================================================================

CREATE OR REPLACE FUNCTION mark_admin_chat_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_chat_participants
  SET 
    unread_count = 0,
    last_read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- HABILITAR REALTIME
-- ================================================================

-- Publicar mudanças nas conversas (com tratamento de erro se já existir)
DO $$
BEGIN
  -- Tentar adicionar admin_chat_conversations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_chat_conversations;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
  
  -- Tentar adicionar admin_chat_messages
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_chat_messages;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
  
  -- Tentar adicionar admin_chat_participants
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_chat_participants;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
END $$;

-- ================================================================
-- COMENTÁRIOS
-- ================================================================

COMMENT ON TABLE admin_chat_conversations IS 'Conversas do chat interno entre administradores';
COMMENT ON TABLE admin_chat_participants IS 'Participantes de cada conversa (N:N)';
COMMENT ON TABLE admin_chat_messages IS 'Mensagens do chat interno';
COMMENT ON FUNCTION create_direct_conversation IS 'Cria ou retorna conversa direta entre 2 usuários';
COMMENT ON FUNCTION mark_admin_chat_as_read IS 'Marca conversa como lida e zera contador';
