-- ========================================
-- FIX: Atualizar venda com valor zerado
-- ========================================
-- Corrigir venda do Helcio que está com R$ 0,00
-- Data: 27/01/2026
-- ========================================

-- Verificar a venda
SELECT 
    id,
    customer_email,
    customer_name,
    total_amount,
    amount,
    order_status,
    payment_gateway,
    created_at
FROM sales
WHERE customer_email = 'contato@helciomattos.com.br'
ORDER BY created_at DESC
LIMIT 1;

-- Atualizar com valor correto (R$ 497,00 - preço do produto)
UPDATE sales
SET 
    total_amount = 497.00,
    amount = 497.00
WHERE customer_email = 'contato@helciomattos.com.br'
AND total_amount = 0;

-- Verificar após update
SELECT 
    id,
    customer_email,
    customer_name,
    total_amount,
    amount,
    order_status,
    payment_gateway,
    created_at
FROM sales
WHERE customer_email = 'contato@helciomattos.com.br'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ Agora deve mostrar R$ 497,00
