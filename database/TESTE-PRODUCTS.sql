-- =====================================================
-- SCRIPT DE TESTE - PRODUCTS INTELLIGENCE
-- =====================================================
-- 
-- Use este script DEPOIS de executar PRODUCTS-INTELLIGENCE-MINIMAL.sql
-- para validar que tudo está funcionando corretamente
--
-- =====================================================

-- 1. VERIFICAR TABELAS CRIADAS
SELECT 'Verificando tabelas criadas...' as teste;

SELECT 
    table_name,
    '✅ Criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'products', 'sales', 'sales_items')
ORDER BY table_name;

-- Resultado esperado: 4 linhas

-- =====================================================

-- 2. VERIFICAR VIEWS CRIADAS
SELECT 'Verificando views criadas...' as teste;

SELECT 
    table_name,
    '✅ Criada' as status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('product_performance', 'product_trends')
ORDER BY table_name;

-- Resultado esperado: 2 linhas

-- =====================================================

-- 3. VERIFICAR FUNÇÃO CRIADA
SELECT 'Verificando função de auto-discovery...' as teste;

SELECT 
    routine_name,
    '✅ Criada' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'discover_products_from_sales';

-- Resultado esperado: 1 linha

-- =====================================================

-- 4. TESTAR VIEW product_performance (PODE ESTAR VAZIA)
SELECT 'Testando VIEW product_performance...' as teste;

SELECT * FROM public.product_performance
LIMIT 5;

-- Se retornar vazio: Normal, você ainda não tem vendas
-- Se retornar dados: ✅ Perfeito!
-- Se der erro: ❌ Problema na VIEW

-- =====================================================

-- 5. TESTAR VIEW product_trends (PODE ESTAR VAZIA)
SELECT 'Testando VIEW product_trends...' as teste;

SELECT * FROM public.product_trends
LIMIT 5;

-- Se retornar vazio: Normal, você ainda não tem vendas recentes
-- Se retornar dados: ✅ Perfeito!

-- =====================================================

-- 6. TESTAR FUNÇÃO discover_products_from_sales (PODE ESTAR VAZIA)
SELECT 'Testando função discover_products_from_sales...' as teste;

SELECT * FROM public.discover_products_from_sales()
LIMIT 5;

-- Se retornar vazio: Normal, você ainda não tem vendas
-- Se retornar dados: ✅ Perfeito!

-- =====================================================

-- 7. INSERIR DADOS DE TESTE (OPCIONAL)
-- Descomente as linhas abaixo se quiser testar com dados fictícios

/*
-- Inserir cliente de teste
INSERT INTO public.customers (email, name, phone)
VALUES ('teste@exemplo.com', 'Cliente Teste', '11999999999')
ON CONFLICT (email) DO NOTHING;

-- Inserir produto de teste
INSERT INTO public.products (external_id, name, price, category)
VALUES ('PROD-TEST-001', 'Gravador Médico Pro - Teste', 97.00, 'teste')
ON CONFLICT (external_id) DO NOTHING;

-- Inserir venda de teste
INSERT INTO public.sales (customer_email, total_amount, status, payment_method)
VALUES ('teste@exemplo.com', 97.00, 'approved', 'credit_card')
RETURNING id;

-- Copie o ID retornado acima e cole aqui:
-- Substitua 'SEU-ID-AQUI' pelo UUID retornado
INSERT INTO public.sales_items (sale_id, product_name, product_sku, price, quantity)
VALUES ('SEU-ID-AQUI', 'Gravador Médico Pro - Teste', 'PROD-TEST-001', 97.00, 1);

-- Agora teste novamente a VIEW:
SELECT * FROM public.product_performance;
*/

-- =====================================================

-- 8. VERIFICAR ÍNDICES CRIADOS
SELECT 'Verificando índices criados...' as teste;

SELECT 
    indexname,
    tablename,
    '✅ Criado' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Resultado esperado: 7 índices

-- =====================================================

-- 9. VERIFICAR RLS (ROW LEVEL SECURITY)
SELECT 'Verificando RLS habilitado...' as teste;

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Desabilitado'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'sales', 'sales_items')
ORDER BY tablename;

-- Resultado esperado: 3 linhas com rls_enabled = true

-- =====================================================

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 'Verificando políticas RLS criadas...' as teste;

SELECT 
    tablename,
    policyname,
    '✅ Criada' as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Resultado esperado: 5 políticas

-- =====================================================
-- ✅ TESTE COMPLETO!
-- =====================================================
-- 
-- Se todos os testes acima passaram, o setup está correto!
-- 
-- Próximos passos:
-- 1. Acesse: http://localhost:3000/admin/products
-- 2. Clique em "Sincronizar com Vendas"
-- 3. Comece a usar o sistema!
-- =====================================================
