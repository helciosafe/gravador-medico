-- =====================================================
-- ADICIONAR CAMPO DE CUPOM NA TABELA SALES
-- =====================================================
-- Criado em: 26/01/2026
-- Descrição: Adiciona campo coupon_code para rastrear cupons usados
-- =====================================================

-- 1. Adicionar coluna coupon_code na tabela sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- 2. Adicionar coluna discount_amount para valor do desconto do cupom
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0;

-- 3. Criar índice para busca por cupom
CREATE INDEX IF NOT EXISTS idx_sales_coupon_code ON public.sales(coupon_code);

-- 4. Adicionar comentários
COMMENT ON COLUMN public.sales.coupon_code IS 'Código do cupom utilizado na compra';
COMMENT ON COLUMN public.sales.coupon_discount IS 'Valor do desconto aplicado pelo cupom';

-- 5. Função para sincronizar contadores de cupons
-- Esta função conta quantas vendas usaram cada cupom e atualiza o usage_count
CREATE OR REPLACE FUNCTION sync_coupon_usage_counts()
RETURNS TABLE(
    coupon_code TEXT,
    sales_count BIGINT,
    updated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH coupon_sales AS (
        SELECT 
            UPPER(s.coupon_code) as code,
            COUNT(*) as count
        FROM public.sales s
        WHERE s.coupon_code IS NOT NULL
        AND s.status IN ('paid', 'approved', 'completed')
        GROUP BY UPPER(s.coupon_code)
    )
    UPDATE public.coupons c
    SET usage_count = cs.count
    FROM coupon_sales cs
    WHERE UPPER(c.code) = cs.code
    RETURNING cs.code::TEXT, cs.count, true;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para incrementar cupom automaticamente quando venda for paga
CREATE OR REPLACE FUNCTION increment_coupon_on_sale_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a venda foi marcada como paga e tem cupom
    IF NEW.status IN ('paid', 'approved', 'completed') 
       AND OLD.status NOT IN ('paid', 'approved', 'completed')
       AND NEW.coupon_code IS NOT NULL THEN
        
        -- Incrementar uso do cupom
        UPDATE public.coupons
        SET usage_count = usage_count + 1
        WHERE UPPER(code) = UPPER(NEW.coupon_code)
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger
DROP TRIGGER IF EXISTS trigger_increment_coupon_on_sale_paid ON public.sales;
CREATE TRIGGER trigger_increment_coupon_on_sale_paid
    AFTER UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_on_sale_paid();

-- 8. Script para migrar dados existentes (caso tenha cupons no metadata)
-- Este script tenta extrair cupons do campo metadata se existir
UPDATE public.sales
SET coupon_code = metadata->>'coupon_code'
WHERE metadata ? 'coupon_code'
AND coupon_code IS NULL;

-- 9. Sincronizar contadores de cupons com base nas vendas existentes
-- Execute esta função para atualizar os contadores
SELECT * FROM sync_coupon_usage_counts();

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
