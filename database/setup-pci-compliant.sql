-- ========================================
-- SQL PCI COMPLIANT - TOKENIZAÇÃO DUPLA
-- Execute no Supabase SQL Editor
-- Data: 26/01/2026
-- ========================================

-- =====================================================
-- 1. ATUALIZAR TABELA SALES (Adicionar fallback_used)
-- =====================================================

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB,
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway ON public.sales(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id ON public.sales(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_fallback_used ON public.sales(fallback_used) WHERE fallback_used = true;

-- Comentários descritivos
COMMENT ON COLUMN public.sales.payment_gateway IS 'Gateway que aprovou: mercadopago ou appmax';
COMMENT ON COLUMN public.sales.mercadopago_payment_id IS 'ID do pagamento no Mercado Pago';
COMMENT ON COLUMN public.sales.gateway_attempts IS 'Histórico de tentativas (JSON com gateway, success, timestamp)';
COMMENT ON COLUMN public.sales.payment_details IS 'Detalhes completos do pagamento do gateway';
COMMENT ON COLUMN public.sales.fallback_used IS 'TRUE se AppMax aprovou após MP recusar (venda resgatada)';

-- =====================================================
-- 2. CRIAR TABELA: LOGS BRUTOS DE WEBHOOK
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mp_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  event_id TEXT,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mp_webhook_logs_event_id ON mp_webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_logs_created_at ON mp_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_logs_processed ON mp_webhook_logs(processed) WHERE processed = false;

-- Comentários
COMMENT ON TABLE public.mp_webhook_logs IS 'Log bruto de TODOS os webhooks do Mercado Pago para auditoria e debug';
COMMENT ON COLUMN public.mp_webhook_logs.retry_count IS 'Quantas vezes tentamos processar este webhook';
COMMENT ON COLUMN public.mp_webhook_logs.last_error IS 'Último erro ao processar (para debug)';

-- =====================================================
-- 3. TABELA DE ANÁLISE: PAYMENT_ATTEMPTS (Já existe)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gateway_attempts JSONB NOT NULL,
    final_status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_email ON public.payment_attempts(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON public.payment_attempts(created_at DESC);

-- =====================================================
-- 4. ATUALIZAR VENDAS EXISTENTES
-- =====================================================

-- Marcar vendas antigas do AppMax como não-resgatadas
UPDATE public.sales 
SET payment_gateway = 'appmax',
    fallback_used = false
WHERE appmax_order_id IS NOT NULL 
  AND payment_gateway IS NULL;

-- =====================================================
-- 5. QUERIES DE ANALYTICS
-- =====================================================

-- View: Vendas Recuperadas (AppMax salvou após MP recusar)
CREATE OR REPLACE VIEW public.vendas_recuperadas AS
SELECT 
  id,
  customer_email,
  customer_name,
  amount,
  gateway_attempts,
  created_at,
  (gateway_attempts->0->>'gateway') AS gateway_tentativa_1,
  (gateway_attempts->1->>'gateway') AS gateway_aprovacao
FROM public.sales
WHERE payment_gateway = 'appmax'
  AND fallback_used = true
  AND status = 'paid'
ORDER BY created_at DESC;

COMMENT ON VIEW public.vendas_recuperadas IS 'Vendas que AppMax aprovou depois de MP recusar - ROI da cascata';

-- =====================================================
-- 6. FUNÇÃO: CALCULAR TAXA DE RESGATE
-- =====================================================

CREATE OR REPLACE FUNCTION public.calcular_taxa_resgate()
RETURNS TABLE (
  vendas_resgatadas BIGINT,
  vendas_appmax_total BIGINT,
  taxa_resgate_percent NUMERIC
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
    ) AS taxa_resgate_percent
  FROM public.sales
  WHERE payment_gateway = 'appmax'
    AND status = 'paid';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calcular_taxa_resgate IS 'Calcula % de vendas que AppMax resgatou após MP recusar';

-- =====================================================
-- 7. TESTES E VALIDAÇÕES
-- =====================================================

-- Verificar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sales'
  AND column_name IN ('payment_gateway', 'fallback_used', 'gateway_attempts')
ORDER BY ordinal_position;

-- Testar função de taxa de resgate
SELECT * FROM public.calcular_taxa_resgate();

-- Testar view de vendas recuperadas
SELECT COUNT(*) FROM public.vendas_recuperadas;

-- =====================================================
-- 8. EXEMPLO DE QUERY: DASHBOARD EXECUTIVO
-- =====================================================

-- Resumo de Performance por Gateway
SELECT 
  payment_gateway,
  COUNT(*) AS total_vendas,
  SUM(amount) AS receita_total,
  COUNT(*) FILTER (WHERE fallback_used = true) AS vendas_resgatadas,
  ROUND(AVG(amount), 2) AS ticket_medio
FROM public.sales
WHERE status = 'paid'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY payment_gateway
ORDER BY total_vendas DESC;

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas atualizadas com sucesso!';
  RAISE NOTICE '✅ View "vendas_recuperadas" criada';
  RAISE NOTICE '✅ Função "calcular_taxa_resgate()" disponível';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Próximos passos:';
  RAISE NOTICE '1. Configurar variáveis de ambiente (LOVABLE_API_SECRET, etc)';
  RAISE NOTICE '2. Criar rota /api/checkout/process';
  RAISE NOTICE '3. Implementar tokenização dupla no frontend';
  RAISE NOTICE '4. Atualizar webhook com race condition fix';
END $$;
