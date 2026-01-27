-- ========================================
-- FIX: Views para Gateway de Pagamentos
-- ========================================
-- Cria views necessárias para mostrar dados do MP e AppMax
-- Data: 27/01/2026
-- ========================================

-- =====================================================
-- 1. VIEW: sales_by_gateway
-- =====================================================
-- Métricas agregadas por gateway (MP vs AppMax)

CREATE OR REPLACE VIEW public.sales_by_gateway AS
SELECT 
    s.payment_gateway,
    COUNT(*) as total_sales,
    COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')) as successful_sales,
    COALESCE(SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')), 0) as total_revenue,
    COALESCE(AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')), 0) as avg_ticket,
    ROUND(
        COALESCE(
            COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active'))::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100,
            0
        ),
        2
    ) as approval_rate
FROM public.sales s
WHERE s.payment_gateway IS NOT NULL
GROUP BY s.payment_gateway;

-- =====================================================
-- 2. VIEW: payment_gateway_performance
-- =====================================================
-- Performance diária por gateway

CREATE OR REPLACE VIEW public.payment_gateway_performance AS
SELECT 
    s.payment_gateway,
    DATE(s.created_at) as sale_date,
    COUNT(*) as attempts,
    COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')) as approvals,
    COUNT(*) FILTER (WHERE s.order_status = 'failed') as rejections,
    SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')) as revenue,
    AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')) as avg_ticket,
    ROUND(
        COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active'))::numeric / 
        NULLIF(COUNT(*)::numeric, 0) * 100, 
        2
    ) as approval_rate
FROM public.sales s
WHERE s.payment_gateway IS NOT NULL
GROUP BY s.payment_gateway, DATE(s.created_at)
ORDER BY sale_date DESC, payment_gateway;

-- =====================================================
-- 3. VIEW: cascata_analysis
-- =====================================================
-- Análise do sistema de cascata MP → AppMax

CREATE OR REPLACE VIEW public.cascata_analysis AS
WITH mp_attempts AS (
    SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active')) as approved,
        COUNT(*) FILTER (WHERE order_status = 'failed') as rejected,
        SUM(total_amount) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active')) as revenue
    FROM public.sales
    WHERE payment_gateway = 'mercadopago'
),
fallback_rescues AS (
    SELECT 
        COUNT(*) as rescued_count,
        SUM(total_amount) as rescued_revenue
    FROM public.sales
    WHERE payment_gateway = 'appmax'
    AND fallback_used = true
),
appmax_direct AS (
    SELECT 
        COUNT(*) as direct_count,
        SUM(total_amount) as direct_revenue
    FROM public.sales
    WHERE payment_gateway = 'appmax'
    AND (fallback_used = false OR fallback_used IS NULL)
)
SELECT
    mp.total_attempts as mp_total,
    mp.approved as mp_approved,
    mp.rejected as mp_rejected,
    mp.revenue as mp_revenue,
    ROUND((mp.approved::numeric / NULLIF(mp.total_attempts::numeric, 0)) * 100, 2) as mp_approval_rate,
    
    fr.rescued_count,
    fr.rescued_revenue,
    ROUND((fr.rescued_count::numeric / NULLIF(mp.rejected::numeric, 0)) * 100, 2) as rescue_rate,
    
    ad.direct_count as appmax_direct,
    ad.direct_revenue as appmax_direct_revenue,
    
    (mp.approved + COALESCE(fr.rescued_count, 0) + COALESCE(ad.direct_count, 0)) as total_sales,
    (mp.revenue + COALESCE(fr.rescued_revenue, 0) + COALESCE(ad.direct_revenue, 0)) as total_revenue
FROM mp_attempts mp
CROSS JOIN fallback_rescues fr
CROSS JOIN appmax_direct ad;

-- =====================================================
-- 4. FUNÇÃO RPC: get_gateway_stats
-- =====================================================
-- Função para buscar stats por gateway com filtro de data

CREATE OR REPLACE FUNCTION public.get_gateway_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    gateway TEXT,
    total_sales BIGINT,
    successful_sales BIGINT,
    total_revenue NUMERIC,
    avg_ticket NUMERIC,
    approval_rate NUMERIC,
    fallback_count BIGINT,
    fallback_revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.payment_gateway as gateway,
        COUNT(*) as total_sales,
        COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')) as successful_sales,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')), 0) as total_revenue,
        COALESCE(AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active')), 0) as avg_ticket,
        ROUND(
            COALESCE(
                COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active'))::numeric / 
                NULLIF(COUNT(*)::numeric, 0) * 100,
                0
            ),
            2
        ) as approval_rate,
        COUNT(*) FILTER (WHERE s.fallback_used = true) as fallback_count,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.fallback_used = true AND s.order_status IN ('paid', 'provisioning', 'active')), 0) as fallback_revenue
    FROM public.sales s
    WHERE s.created_at BETWEEN start_date AND end_date
    AND s.payment_gateway IS NOT NULL
    GROUP BY s.payment_gateway;
END;
$$;

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON VIEW public.sales_by_gateway IS 'Métricas agregadas por gateway de pagamento';
COMMENT ON VIEW public.payment_gateway_performance IS 'Performance diária de cada gateway';
COMMENT ON VIEW public.cascata_analysis IS 'Análise completa do sistema de cascata MP → AppMax';
COMMENT ON FUNCTION public.get_gateway_stats IS 'Busca estatísticas por gateway com filtro de período';

-- =====================================================
-- ✅ VERIFICAÇÃO
-- =====================================================

SELECT '✅ Views e funções para Gateway criadas!' as status;

-- Testar views
SELECT * FROM sales_by_gateway;
SELECT * FROM cascata_analysis;

-- Testar função
SELECT * FROM get_gateway_stats(NOW() - INTERVAL '7 days', NOW());
