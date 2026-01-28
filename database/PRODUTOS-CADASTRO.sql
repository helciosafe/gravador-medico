-- =====================================================
-- 🎯 POPULAR PRODUTOS - GRAVADOR MÉDICO
-- =====================================================
-- Execute este SQL no Supabase para cadastrar os produtos
-- Eles aparecerão corretamente no painel admin/products
-- =====================================================

-- 1️⃣ LIMPAR PRODUTOS ANTIGOS (opcional - cuidado!)
-- DELETE FROM public.products WHERE sku LIKE 'GRAV-%' OR sku LIKE 'BUMP-%';

-- 2️⃣ INSERIR PRODUTO PRINCIPAL
INSERT INTO public.products (
    id,
    external_id,
    appmax_product_id,
    name,
    description,
    price,
    category,
    plan_type,
    is_active,
    is_featured,
    checkout_url,
    metadata,
    tags
) VALUES (
    gen_random_uuid(),
    'gravador-medico-vitalicio',
    '32991339',
    'Gravador Médico - Acesso Vitalício',
    'Acesso completo e vitalício ao Gravador Médico com todas as funcionalidades de transcrição e prontuários inteligentes.',
    36.00,
    'one_time',
    'lifetime',
    true,
    true,
    'https://gravadormedico1768482029857.carrinho.app/one-checkout/ocudf/32991339',
    jsonb_build_object(
        'sku', 'GRAV-MAIN-001',
        'type', 'main',
        'original_price', 97.00,
        'gateway_primary', 'mercadopago',
        'gateway_fallback', 'appmax',
        'features', ARRAY[
            'Acesso vitalício',
            'Transcrição automática de consultas',
            'Prontuários inteligentes',
            'Sem mensalidades'
        ]
    ),
    ARRAY['main', 'vitalicio', 'gravador']
)
ON CONFLICT (external_id) 
DO UPDATE SET
    appmax_product_id = EXCLUDED.appmax_product_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    plan_type = EXCLUDED.plan_type,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    checkout_url = EXCLUDED.checkout_url,
    metadata = EXCLUDED.metadata,
    tags = EXCLUDED.tags,
    updated_at = now();

-- 3️⃣ INSERIR ORDER BUMP 1 - Conteúdo Infinito
INSERT INTO public.products (
    id,
    external_id,
    appmax_product_id,
    name,
    description,
    price,
    category,
    plan_type,
    is_active,
    is_featured,
    metadata,
    tags
) VALUES (
    gen_random_uuid(),
    'conteudo-infinito-instagram',
    '32989468',
    'Conteúdo Infinito para Instagram',
    'Templates e ideias infinitas para seu Instagram médico. 100+ templates prontos, calendário de conteúdo e scripts para Reels.',
    29.90,
    'bump',
    'one_time',
    true,
    false,
    jsonb_build_object(
        'sku', 'BUMP-001',
        'type', 'bump',
        'original_price', 97.00,
        'bump_order', 1,
        'features', ARRAY[
            '100+ templates prontos',
            'Calendário de conteúdo',
            'Scripts para Reels'
        ]
    ),
    ARRAY['bump', 'instagram', 'conteudo']
)
ON CONFLICT (external_id) 
DO UPDATE SET
    appmax_product_id = EXCLUDED.appmax_product_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    tags = EXCLUDED.tags,
    updated_at = now();

-- 4️⃣ INSERIR ORDER BUMP 2 - Implementação Assistida
INSERT INTO public.products (
    id,
    external_id,
    appmax_product_id,
    name,
    description,
    price,
    category,
    plan_type,
    is_active,
    is_featured,
    metadata,
    tags
) VALUES (
    gen_random_uuid(),
    'implementacao-assistida',
    '32989503',
    'Implementação Assistida',
    'Suporte dedicado para configurar tudo para você. Configuração completa, suporte 1:1 e integração personalizada.',
    97.00,
    'bump',
    'one_time',
    true,
    false,
    jsonb_build_object(
        'sku', 'BUMP-002',
        'type', 'bump',
        'original_price', 297.00,
        'bump_order', 2,
        'features', ARRAY[
            'Configuração completa',
            'Suporte 1:1',
            'Integração personalizada'
        ]
    ),
    ARRAY['bump', 'implementacao', 'suporte']
)
ON CONFLICT (external_id) 
DO UPDATE SET
    appmax_product_id = EXCLUDED.appmax_product_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    tags = EXCLUDED.tags,
    updated_at = now();

-- 5️⃣ INSERIR ORDER BUMP 3 - Análise Inteligente
INSERT INTO public.products (
    id,
    external_id,
    appmax_product_id,
    name,
    description,
    price,
    category,
    plan_type,
    is_active,
    is_featured,
    metadata,
    tags
) VALUES (
    gen_random_uuid(),
    'analise-inteligente',
    '32989520',
    'Análise Inteligente de Consultas',
    'IA avançada para análise de consultas e insights. Análise por IA, relatórios automáticos e insights de pacientes.',
    39.90,
    'bump',
    'one_time',
    true,
    false,
    jsonb_build_object(
        'sku', 'BUMP-003',
        'type', 'bump',
        'original_price', 147.00,
        'bump_order', 3,
        'features', ARRAY[
            'Análise por IA',
            'Relatórios automáticos',
            'Insights de pacientes'
        ]
    ),
    ARRAY['bump', 'analise', 'ia']
)
ON CONFLICT (external_id) 
DO UPDATE SET
    appmax_product_id = EXCLUDED.appmax_product_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    tags = EXCLUDED.tags,
    updated_at = now();

-- 6️⃣ VERIFICAR PRODUTOS INSERIDOS
SELECT 
    external_id as id,
    name,
    price,
    category,
    appmax_product_id,
    is_active,
    metadata->>'type' as tipo,
    metadata->>'bump_order' as ordem_bump
FROM public.products
WHERE external_id IN (
    'gravador-medico-vitalicio',
    'conteudo-infinito-instagram',
    'implementacao-assistida',
    'analise-inteligente'
)
ORDER BY 
    CASE WHEN metadata->>'type' = 'main' THEN 0 ELSE 1 END,
    (metadata->>'bump_order')::int NULLS LAST;
