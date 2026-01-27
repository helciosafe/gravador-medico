-- ========================================
-- SQL PARA MERCADO PAGO + CASCATA
-- Execute no Supabase SQL Editor
-- ========================================

-- Adicionar colunas para gateway
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB,
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway 
ON public.sales(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id 
ON public.sales(mercadopago_payment_id);

-- Criar tabela de análise de tentativas
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gateway_attempts JSONB NOT NULL,
    final_status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_email 
ON public.payment_attempts(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at 
ON public.payment_attempts(created_at DESC);

-- Comentários descritivos
COMMENT ON COLUMN public.sales.payment_gateway IS 'Gateway que aprovou: mercadopago ou appmax';
COMMENT ON COLUMN public.sales.mercadopago_payment_id IS 'ID do pagamento no Mercado Pago';
COMMENT ON COLUMN public.sales.gateway_attempts IS 'Histórico de tentativas em todos os gateways (JSON)';
COMMENT ON COLUMN public.sales.payment_details IS 'Detalhes completos do pagamento do gateway';

COMMENT ON TABLE public.payment_attempts IS 'Log de todas as tentativas de pagamento (para análise de conversão)';

-- Atualizar vendas existentes
UPDATE public.sales 
SET payment_gateway = 'appmax' 
WHERE appmax_order_id IS NOT NULL AND payment_gateway IS NULL;

-- ========================================
-- QUERIES ÚTEIS
-- ========================================

-- Ver taxa de aprovação por gateway
SELECT 
    payment_gateway,
    COUNT(*) as total_vendas,
    COUNT(*) FILTER (WHERE status = 'paid') as vendas_pagas,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid')::NUMERIC / 
        NULLIF(COUNT(*), 0)::NUMERIC * 100, 
        2
    ) as taxa_aprovacao_pct
FROM public.sales
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_gateway
ORDER BY taxa_aprovacao_pct DESC;

-- Ver casos onde AppMax salvou após MP recusar
SELECT 
    customer_email,
    total_amount,
    payment_gateway,
    gateway_attempts,
    created_at
FROM public.sales
WHERE payment_gateway = 'appmax'
AND gateway_attempts::jsonb @> '[{"gateway": "mercadopago", "success": false}]'::jsonb
ORDER BY created_at DESC
LIMIT 20;
