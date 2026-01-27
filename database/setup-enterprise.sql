-- ========================================
-- SQL ENTERPRISE LEVEL - FULL IMPLEMENTATION
-- Execute no Supabase SQL Editor
-- Data: 26/01/2026
-- ========================================

-- =====================================================
-- 1. CRIAR ENUMS (Tipos Customizados)
-- =====================================================

-- Status do pedido (Máquina de Estados)
CREATE TYPE order_status AS ENUM (
  'draft',              -- Pedido criado, aguardando pagamento
  'processing',         -- Processando pagamento
  'paid',              -- Pagamento aprovado
  'provisioning',      -- Criando usuário/enviando email
  'active',            -- Tudo completo, cliente ativo
  'provisioning_failed', -- Pagamento OK mas entrega falhou
  'failed',            -- Pagamento recusado
  'cancelled'          -- Cancelado manualmente
);

-- Provider de pagamento
CREATE TYPE payment_provider AS ENUM ('mercadopago', 'appmax');

-- Status da tentativa de pagamento
CREATE TYPE payment_attempt_status AS ENUM ('success', 'failed', 'rejected', 'pending');

-- Status da fila de provisionamento
CREATE TYPE provisioning_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- =====================================================
-- 2. ATUALIZAR TABELA SALES (Principal)
-- =====================================================

-- Adicionar colunas para idempotência e máquina de estados
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS current_gateway TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB,
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);

-- Criar constraint UNIQUE apenas se não existir (evita erro em re-execução)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_idempotency_key_unique'
  ) THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_idempotency_key_unique UNIQUE (idempotency_key);
  END IF;
END $$;

-- Índices críticos para performance
CREATE INDEX IF NOT EXISTS idx_sales_idempotency_key ON public.sales(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON public.sales(order_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway ON public.sales(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id ON public.sales(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_fallback_used ON public.sales(fallback_used) WHERE fallback_used = true;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON public.sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários descritivos
COMMENT ON COLUMN public.sales.idempotency_key IS 'Chave única para evitar cobrança dupla (UUID gerado no frontend)';
COMMENT ON COLUMN public.sales.order_status IS 'Estado atual: draft→processing→paid→provisioning→active';
COMMENT ON COLUMN public.sales.current_gateway IS 'Gateway que processou o pagamento (mercadopago ou appmax)';
COMMENT ON COLUMN public.sales.fallback_used IS 'TRUE se AppMax aprovou após MP recusar';
COMMENT ON COLUMN public.sales.amount IS 'Valor para compatibilidade com código enterprise (= total_amount)';

-- =====================================================
-- 3. CRIAR TABELA: PAYMENT_ATTEMPTS (Histórico Tipado)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  
  -- Dados do gateway
  provider TEXT NOT NULL, -- 'mercadopago' ou 'appmax'
  gateway_transaction_id TEXT,
  
  -- Status e erro
  status TEXT NOT NULL, -- 'success', 'failed', 'rejected', 'pending'
  rejection_code TEXT, -- Código específico do gateway (ex: cc_rejected_high_risk)
  error_message TEXT,
  
  -- Dados completos
  raw_response JSONB NOT NULL,
  
  -- Performance
  response_time_ms INT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_attempts_sale_id ON public.payment_attempts(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider ON public.payment_attempts(provider);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_gateway_transaction ON public.payment_attempts(gateway_transaction_id);

COMMENT ON TABLE public.payment_attempts IS 'Histórico granular de TODAS as tentativas de pagamento (1:N com sales)';
COMMENT ON COLUMN public.payment_attempts.rejection_code IS 'Código de rejeição do gateway para análise';

-- =====================================================
-- 4. CRIAR TABELA: WEBHOOK_LOGS (Ingestão)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  provider TEXT NOT NULL, -- 'mercadopago', 'appmax'
  event_id TEXT, -- ID único do evento no gateway
  topic TEXT NOT NULL, -- 'payment.updated', 'order.approved', etc
  
  -- Payload
  raw_payload JSONB NOT NULL,
  
  -- Processamento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON public.webhook_logs(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON public.webhook_logs(provider);

COMMENT ON TABLE public.webhook_logs IS 'Log bruto de TODOS os webhooks recebidos (Vacuum Pattern)';

-- =====================================================
-- 5. CRIAR TABELA: PROVISIONING_QUEUE (Fila de Entrega)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.provisioning_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Retry
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Erro
  last_error TEXT,
  error_details JSONB,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_sale_id ON public.provisioning_queue(sale_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_status ON public.provisioning_queue(status);
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_next_retry ON public.provisioning_queue(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_provisioning_queue_created_at ON public.provisioning_queue(created_at DESC);

COMMENT ON TABLE public.provisioning_queue IS 'Fila para processar entrega (Lovable + Email) com retry automático';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_provisioning_queue_updated_at ON public.provisioning_queue;
CREATE TRIGGER update_provisioning_queue_updated_at 
    BEFORE UPDATE ON public.provisioning_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CRIAR TABELA: INTEGRATION_LOGS (Pós-Venda)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  
  -- Ação
  action TEXT NOT NULL, -- 'create_user_lovable', 'send_email', 'reset_password'
  
  -- Status
  status TEXT NOT NULL, -- 'success', 'error'
  
  -- Dados
  recipient_email TEXT,
  user_id TEXT, -- ID do usuário criado no Lovable
  details JSONB,
  
  -- Erro
  error_message TEXT,
  
  -- HTTP (se aplicável)
  http_status_code INT,
  request_payload JSONB,
  response_payload JSONB,
  
  -- Performance
  duration_ms INT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integration_logs_sale_id ON public.integration_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_action ON public.integration_logs(action);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at DESC);

COMMENT ON TABLE public.integration_logs IS 'Log de todas as integrações externas (Lovable, Email, etc)';

-- =====================================================
-- 7. VIEWS ANALÍTICAS
-- =====================================================

-- View: Vendas Recuperadas pelo Fallback
CREATE OR REPLACE VIEW public.vendas_recuperadas AS
SELECT 
  s.id,
  s.customer_email,
  s.customer_name,
  s.amount,
  s.order_status,
  s.payment_gateway,
  s.created_at,
  (SELECT COUNT(*) FROM public.payment_attempts pa WHERE pa.sale_id = s.id) AS total_tentativas,
  (SELECT pa.raw_response FROM public.payment_attempts pa WHERE pa.sale_id = s.id AND pa.provider = 'mercadopago' LIMIT 1) AS mp_response,
  (SELECT pa.raw_response FROM public.payment_attempts pa WHERE pa.sale_id = s.id AND pa.provider = 'appmax' LIMIT 1) AS appmax_response
FROM public.sales s
WHERE s.fallback_used = true
  AND s.order_status IN ('paid', 'provisioning', 'active')
ORDER BY s.created_at DESC;

COMMENT ON VIEW public.vendas_recuperadas IS 'Vendas que AppMax resgatou após MP recusar (ROI do fallback)';

-- View: Pedidos com Entrega Falhada
CREATE OR REPLACE VIEW public.pedidos_entrega_falhada AS
SELECT 
  s.id,
  s.customer_email,
  s.customer_name,
  s.amount,
  s.payment_gateway,
  s.created_at,
  pq.retry_count,
  pq.last_error,
  pq.next_retry_at
FROM public.sales s
LEFT JOIN public.provisioning_queue pq ON pq.sale_id = s.id
WHERE s.order_status = 'provisioning_failed'
ORDER BY s.created_at DESC;

COMMENT ON VIEW public.pedidos_entrega_falhada IS 'Pedidos pagos mas com falha na entrega (Lovable/Email)';

-- =====================================================
-- 8. FUNÇÕES ANALÍTICAS
-- =====================================================

-- Função: Calcular Taxa de Resgate
CREATE OR REPLACE FUNCTION public.calcular_taxa_resgate()
RETURNS TABLE (
  vendas_resgatadas BIGINT,
  vendas_appmax_total BIGINT,
  taxa_resgate_percent NUMERIC,
  receita_resgatada NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE fallback_used = true) AS vendas_resgatadas,
    COUNT(*) AS vendas_appmax_total,
    ROUND(
      COUNT(*) FILTER (WHERE fallback_used = true) * 100.0 / 
      NULLIF(COUNT(*), 0), 
      2
    ) AS taxa_resgate_percent,
    ROUND(
      SUM(amount) FILTER (WHERE fallback_used = true),
      2
    ) AS receita_resgatada
  FROM public.sales
  WHERE payment_gateway = 'appmax'
    AND order_status IN ('paid', 'provisioning', 'active');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calcular_taxa_resgate IS 'KPI: Quantas vendas AppMax salvou após MP recusar';

-- Função: Estatísticas de Conversão
CREATE OR REPLACE FUNCTION public.estatisticas_conversao(periodo_dias INT DEFAULT 30)
RETURNS TABLE (
  total_tentativas BIGINT,
  mp_aprovado BIGINT,
  mp_recusado BIGINT,
  appmax_aprovado BIGINT,
  appmax_recusado BIGINT,
  taxa_conversao_geral NUMERIC,
  taxa_resgate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) AS total_tentativas,
    COUNT(*) FILTER (WHERE payment_gateway = 'mercadopago' AND order_status IN ('paid', 'provisioning', 'active')) AS mp_aprovado,
    COUNT(*) FILTER (WHERE payment_gateway = 'mercadopago' AND order_status = 'failed') AS mp_recusado,
    COUNT(*) FILTER (WHERE payment_gateway = 'appmax' AND order_status IN ('paid', 'provisioning', 'active')) AS appmax_aprovado,
    COUNT(*) FILTER (WHERE payment_gateway = 'appmax' AND order_status = 'failed') AS appmax_recusado,
    ROUND(
      COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active')) * 100.0 / 
      NULLIF(COUNT(*), 0),
      2
    ) AS taxa_conversao_geral,
    ROUND(
      COUNT(*) FILTER (WHERE fallback_used = true) * 100.0 / 
      NULLIF(COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active')), 0),
      2
    ) AS taxa_resgate
  FROM public.sales
  WHERE created_at >= NOW() - INTERVAL '1 day' * periodo_dias;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.estatisticas_conversao IS 'Dashboard executivo de conversão de pagamentos';

-- =====================================================
-- 9. FUNCTION: Transição de Estado Segura
-- =====================================================

CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_order_id UUID,
  p_new_status TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
  v_valid_transitions TEXT[];
BEGIN
  -- Buscar status atual
  SELECT order_status INTO v_current_status
  FROM public.sales
  WHERE id = p_order_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Definir transições válidas (Máquina de Estados)
  CASE v_current_status
    WHEN 'draft' THEN
      v_valid_transitions := ARRAY['processing', 'cancelled'];
    WHEN 'processing' THEN
      v_valid_transitions := ARRAY['paid', 'failed', 'cancelled'];
    WHEN 'paid' THEN
      v_valid_transitions := ARRAY['provisioning', 'provisioning_failed'];
    WHEN 'provisioning' THEN
      v_valid_transitions := ARRAY['active', 'provisioning_failed'];
    WHEN 'provisioning_failed' THEN
      v_valid_transitions := ARRAY['provisioning', 'active', 'cancelled'];
    WHEN 'active' THEN
      v_valid_transitions := ARRAY['cancelled'];
    ELSE
      v_valid_transitions := ARRAY[]::TEXT[];
  END CASE;

  -- Verificar se transição é válida
  IF NOT (p_new_status = ANY(v_valid_transitions)) THEN
    RAISE EXCEPTION 'Invalid transition: % -> %', v_current_status, p_new_status;
  END IF;

  -- Executar transição
  UPDATE public.sales
  SET order_status = p_new_status
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.transition_order_status IS 'Garante que transições de estado sejam válidas (State Machine)';

-- =====================================================
-- 10. MIGRAR DADOS EXISTENTES
-- =====================================================

-- Sincronizar amount com total_amount
UPDATE public.sales 
SET amount = total_amount
WHERE amount IS NULL;

-- Atualizar vendas antigas com order_status baseado no status legacy
UPDATE public.sales 
SET 
  order_status = CASE 
    WHEN status = 'approved' THEN 'active'
    WHEN status = 'pending' THEN 'processing'
    WHEN status IN ('rejected', 'cancelled') THEN 'failed'
    ELSE 'draft'
  END,
  payment_gateway = COALESCE(payment_gateway, 'appmax'),
  fallback_used = COALESCE(fallback_used, false),
  idempotency_key = COALESCE(idempotency_key, gen_random_uuid()::TEXT)
WHERE order_status IS NULL;

-- =====================================================
-- ✅ VALIDAÇÕES E TESTES
-- =====================================================

-- Testar views
SELECT COUNT(*) FROM vendas_recuperadas;
SELECT COUNT(*) FROM pedidos_entrega_falhada;

-- Testar funções
SELECT * FROM calcular_taxa_resgate();
SELECT * FROM estatisticas_conversao(30);

-- Testar máquina de estados
-- SELECT transition_order_status('uuid-do-pedido', 'paid');

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE ENTERPRISE LEVEL COMPLETO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Estrutura criada:';
  RAISE NOTICE '  ✅ Tabela sales atualizada (idempotency_key, order_status)';
  RAISE NOTICE '  ✅ Tabela payment_attempts (histórico tipado)';
  RAISE NOTICE '  ✅ Tabela webhook_logs (ingestão)';
  RAISE NOTICE '  ✅ Tabela provisioning_queue (retry automático)';
  RAISE NOTICE '  ✅ Tabela integration_logs (auditoria Lovable)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Views analíticas:';
  RAISE NOTICE '  ✅ vendas_recuperadas';
  RAISE NOTICE '  ✅ pedidos_entrega_falhada';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Funções:';
  RAISE NOTICE '  ✅ calcular_taxa_resgate()';
  RAISE NOTICE '  ✅ estatisticas_conversao()';
  RAISE NOTICE '  ✅ transition_order_status() (State Machine)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Próximo: Implementar backend enterprise!';
END $$;
