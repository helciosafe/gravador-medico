-- =============================================
-- ADICIONAR CAMPO: failure_reason na tabela sales
-- =============================================
-- Armazena o motivo exato da recusa/cancelamento
-- Baseado nos webhooks da AppMax
-- =============================================

-- Adicionar coluna failure_reason
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_sales_failure_reason ON public.sales(failure_reason);

-- =============================================
-- MAPEAMENTO DOS WEBHOOKS APPMAX:
-- =============================================
-- ✅ Pedido aprovado          → status: 'approved'
-- ✅ Pedido autorizado         → status: 'approved'
-- ⏳ Pedido pago               → status: 'paid'
-- ⏳ Pedido pendente de integração → status: 'pending'
-- ⏳ Pedido com boleto vencido → status: 'expired', failure_reason: 'Boleto Vencido'
-- ❌ Pedido Estornado          → status: 'refunded', failure_reason: 'Estornado'
-- ❌ Upsell pago               → status: 'paid' (criar registro separado)
-- 🔵 Pix Gerado                → status: 'pending', payment_method: 'pix'
-- 🔵 Pix Expirado              → status: 'expired', failure_reason: 'PIX Expirado'
-- 🔵 Pix Pago                  → status: 'paid', payment_method: 'pix'
-- ✅ Pedido integrado          → status: 'approved'
-- ⏰ Pedido Autorizado com atraso (60min) → status: 'approved'
-- ⚠️ Pedido Chargeback em Tratamento → status: 'chargeback', failure_reason: 'Chargeback em Análise'
-- ⚠️ Pedido Chargeback Ganho   → status: 'approved', failure_reason: null

-- =============================================
-- EXEMPLOS DE ATUALIZAÇÃO:
-- =============================================

-- Exemplo: Marcar PIX expirado
UPDATE public.sales 
SET failure_reason = 'PIX Expirado'
WHERE status = 'expired' 
  AND payment_method = 'pix';

-- Exemplo: Marcar boleto vencido
UPDATE public.sales 
SET failure_reason = 'Boleto Vencido'
WHERE status = 'expired' 
  AND payment_method = 'boleto';

-- Exemplo: Cartão recusado (genérico)
UPDATE public.sales 
SET failure_reason = 'Cartão Recusado'
WHERE status IN ('canceled', 'refused', 'denied')
  AND payment_method = 'credit_card'
  AND failure_reason IS NULL;

-- Verificar distribuição de motivos
SELECT 
    failure_reason,
    COUNT(*) as total,
    SUM(total_amount) as valor_total
FROM public.sales
WHERE status IN ('canceled', 'refused', 'denied', 'expired')
GROUP BY failure_reason
ORDER BY total DESC;

-- ✅ CONCLUÍDO
-- Execute este SQL no Supabase e depois atualize o webhook handler
