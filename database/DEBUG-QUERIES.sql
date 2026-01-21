-- =============================================
-- QUERIES DE DEBUG - Dashboard Analytics
-- =============================================
-- Execute estas queries no Supabase SQL Editor
-- para validar o refactor e debugar problemas
-- =============================================

-- ========================================
-- 1. VERIFICAR SE AS VIEWS EXISTEM
-- ========================================
SELECT 
  schemaname, 
  viewname, 
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'analytics_health',
    'marketing_attribution',
    'product_performance',
    'analytics_visitors_online',
    'analytics_funnel'
  )
ORDER BY viewname;

-- Resultado esperado: 5 linhas (uma para cada view)

-- ========================================
-- 2. TESTAR analytics_health
-- ========================================
SELECT * FROM analytics_health;

-- Campos esperados:
-- - unique_visitors (número)
-- - sales (número)
-- - revenue (decimal)
-- - average_order_value (decimal)
-- - conversion_rate (decimal entre 0-100)
-- - revenue_change (decimal, pode ser negativo)
-- - aov_change (decimal, pode ser negativo)

-- ========================================
-- 3. TESTAR marketing_attribution
-- ========================================
SELECT 
  source,
  medium,
  visitors,
  sales_count,
  total_revenue,
  conversion_rate,
  primary_device
FROM marketing_attribution
ORDER BY total_revenue DESC
LIMIT 10;

-- Se retornar vazio, pode ser que:
-- a) Nenhum visitante com UTM foi registrado
-- b) Nenhuma venda ocorreu nas últimas 24h após uma visita

-- ========================================
-- 4. TESTAR product_performance
-- ========================================
SELECT 
  product_name,
  product_sku,
  total_revenue,
  total_quantity,
  total_orders
FROM product_performance
ORDER BY total_revenue DESC
LIMIT 5;

-- Se retornar vazio, pode ser que não há vendas aprovadas

-- ========================================
-- 5. TESTAR analytics_visitors_online
-- ========================================
SELECT 
  online_count,
  mobile_count,
  desktop_count,
  NOW() as current_time
FROM analytics_visitors_online;

-- Se online_count = 0:
-- - Nenhum visitante ativo nos últimos 5 minutos
-- - Verifique se o useAnalytics() está funcionando

-- ========================================
-- 6. TESTAR analytics_funnel
-- ========================================
SELECT 
  step_visitors,
  step_interested,
  step_checkout_started,
  step_purchased,
  ROUND((step_purchased::numeric / NULLIF(step_visitors, 0)::numeric) * 100, 2) as conversion_rate_calculated
FROM analytics_funnel;

-- ========================================
-- 7. VER VISITANTES ATIVOS (RAW)
-- ========================================
SELECT 
  session_id,
  page_path,
  device_type,
  utm_source,
  utm_medium,
  last_seen,
  is_online,
  EXTRACT(EPOCH FROM (NOW() - last_seen))::int as seconds_ago
FROM analytics_visits
WHERE is_online = true
  AND last_seen >= NOW() - INTERVAL '10 minutes'
ORDER BY last_seen DESC
LIMIT 20;

-- Se está vazio:
-- - O hook useAnalytics() não está rodando
-- - Ou nenhum visitante acessou o site nos últimos 10 min

-- ========================================
-- 8. VER TODAS AS SESSÕES (ÚLTIMAS 24H)
-- ========================================
SELECT 
  session_id,
  page_path,
  device_type,
  utm_source,
  utm_medium,
  utm_campaign,
  referrer_domain,
  created_at,
  last_seen,
  is_online
FROM analytics_visits
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;

-- ========================================
-- 9. VALIDAR UTMs
-- ========================================
SELECT 
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as session_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_visits
WHERE utm_source IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY session_count DESC;

-- Se retornar vazio:
-- - Nenhum visitante acessou com UTMs
-- - Teste: /?utm_source=teste&utm_medium=debug&utm_campaign=validacao

-- ========================================
-- 10. VALIDAR DEVICE TYPE
-- ========================================
SELECT 
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM analytics_visits
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY device_type
ORDER BY count DESC;

-- Resultado esperado:
-- mobile: ~50-70%
-- desktop: ~25-40%
-- tablet: ~5-10%

-- ========================================
-- 11. VER ATRIBUIÇÃO COMPLETA (RAW)
-- ========================================
SELECT 
  av.session_id,
  av.utm_source,
  av.utm_medium,
  av.utm_campaign,
  av.created_at as visit_time,
  ca.id as checkout_id,
  ca.customer_email,
  ca.total_amount,
  ca.status,
  ca.created_at as sale_time,
  EXTRACT(EPOCH FROM (ca.created_at - av.created_at))::int / 3600 as hours_to_convert
FROM analytics_visits av
INNER JOIN checkout_attempts ca ON 
  ca.created_at BETWEEN av.created_at AND av.created_at + INTERVAL '24 hours'
WHERE av.utm_source IS NOT NULL
  AND ca.status IN ('paid', 'approved', 'completed')
ORDER BY av.created_at DESC
LIMIT 20;

-- Mostra a jornada completa: visita com UTM → venda

-- ========================================
-- 12. VERIFICAR PERFORMANCE DAS VIEWS
-- ========================================
EXPLAIN ANALYZE SELECT * FROM analytics_health;
EXPLAIN ANALYZE SELECT * FROM marketing_attribution;
EXPLAIN ANALYZE SELECT * FROM product_performance;

-- Tempo de execução esperado:
-- - analytics_health: < 100ms
-- - marketing_attribution: < 500ms
-- - product_performance: < 200ms

-- Se estiver lento (> 1 segundo):
-- - Verifique os índices
-- - Execute VACUUM ANALYZE

-- ========================================
-- 13. RECRIAR ÍNDICES (SE NECESSÁRIO)
-- ========================================
-- Execute apenas se as queries estiverem lentas

CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at 
  ON public.analytics_visits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_id 
  ON public.analytics_visits(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_visits_utm_source 
  ON public.analytics_visits(utm_source);

CREATE INDEX IF NOT EXISTS idx_analytics_visits_last_seen 
  ON public.analytics_visits(last_seen) 
  WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_created_status 
  ON public.checkout_attempts(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_customer_email 
  ON public.checkout_attempts(customer_email);

-- ========================================
-- 14. LIMPAR DADOS DE TESTE (CUIDADO!)
-- ========================================
-- Execute APENAS em ambiente de desenvolvimento

-- Limpar sessões antigas (> 30 dias)
DELETE FROM analytics_visits 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Limpar sessões de teste específicas
DELETE FROM analytics_visits 
WHERE utm_campaign = 'teste-refactor';

-- ========================================
-- 15. POPULAR DADOS DE TESTE
-- ========================================
-- Se você precisa de dados para testar

-- Inserir visitas fake
INSERT INTO analytics_visits (
  session_id,
  page_path,
  device_type,
  utm_source,
  utm_medium,
  utm_campaign,
  last_seen,
  is_online,
  created_at
)
VALUES 
  ('test_session_1', '/', 'desktop', 'google', 'cpc', 'teste-refactor', NOW(), true, NOW()),
  ('test_session_2', '/checkout', 'mobile', 'facebook', 'social', 'teste-refactor', NOW(), true, NOW()),
  ('test_session_3', '/', 'tablet', 'instagram', 'organic', 'teste-refactor', NOW(), true, NOW());

-- ========================================
-- 16. VERIFICAR INTEGRIDADE DOS DADOS
-- ========================================

-- Contar registros em cada tabela
SELECT 
  'analytics_visits' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE is_online = true) as currently_online
FROM analytics_visits

UNION ALL

SELECT 
  'checkout_attempts',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'),
  COUNT(*) FILTER (WHERE status IN ('paid', 'approved', 'completed'))
FROM checkout_attempts;

-- ========================================
-- 17. MONITORAR QUERIES EM TEMPO REAL
-- ========================================
-- Execute em outra aba enquanto usa o dashboard

SELECT 
  pid,
  usename,
  application_name,
  state,
  query,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = current_database()
  AND query NOT LIKE '%pg_stat_activity%'
  AND state = 'active'
ORDER BY query_start DESC;

-- ========================================
-- 18. ESTATÍSTICAS DE USO DAS VIEWS
-- ========================================
SELECT 
  schemaname,
  viewname,
  pg_size_pretty(pg_relation_size(schemaname||'.'||viewname)) as size
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE 'analytics%'
ORDER BY viewname;

-- Views não ocupam espaço em disco (são queries armazenadas)
-- Se mostrar tamanho > 0, é porque há cache
