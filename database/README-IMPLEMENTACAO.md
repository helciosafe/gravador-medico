# 🏗️ Plano de Implementação - Arquitetura Completa Dashboard

## 📋 Resumo Executivo

Este documento descreve o plano completo para implementar a arquitetura de dados normalizada do Gravador Médico, incluindo:
- ✅ Tabelas: `customers`, `products`, `sales`, `sales_items`, `crm_contacts`, `crm_activities`
- ✅ Views analíticas para relatórios
- ✅ Webhook Appmax v4.0 com sincronização completa
- ✅ Páginas do dashboard funcionais (Clientes, Produtos, CRM, Relatórios)

---

## 🗂️ Arquivos Criados

### 1. **Schema SQL**
```
/database/01-schema-completo.sql
```
- Criação de todas as tabelas
- Índices otimizados
- Views analíticas
- Políticas RLS

### 2. **Migração**
```
/database/02-migration-sales-customer-id.sql
```
- Adiciona `customer_id` na tabela `sales` existente
- Adiciona colunas faltantes
- Safe para executar em produção

### 3. **Funções Utilitárias**
```
/lib/appmax-sync.ts
```
- `syncCustomerFromAppmax()` - Cria/atualiza clientes
- `syncProductFromAppmax()` - Cria/atualiza produtos
- `createOrUpdateSaleFromAppmax()` - Salva vendas
- `saveSaleItems()` - Salva itens da venda
- `createCRMContactFromSale()` - Cria contatos CRM
- `updateCustomerMetrics()` - Atualiza métricas agregadas
- `updateProductMetrics()` - Atualiza métricas de produtos

### 4. **Helpers de Queries**
```
/lib/dashboard-queries.ts
```
- `fetchCustomersWithMetrics()` - Lista clientes
- `fetchProductsWithMetrics()` - Lista produtos
- `fetchCRMContacts()` - Lista contatos CRM
- `fetchSalesByDay()` - Vendas por dia
- `fetchSalesBySource()` - Vendas por UTM
- `fetchTopProducts()` - Top produtos
- Todos com filtro de data UTC padronizado

### 5. **Webhook Atualizado**
```
/app/api/webhook/appmax/route-v4.ts.example
```
- Versão 4.0 completa
- Sincronização de: Customers → Products → Sales → Items → CRM
- Atualização de métricas agregadas
- Meta CAPI integrado

---

## 🚀 Passo a Passo de Implementação

### **FASE 1: Preparar Banco de Dados** ⏱️ 10-15 min

#### 1.1. Criar Tabelas Novas
```bash
# No SQL Editor do Supabase, execute:
/database/01-schema-completo.sql
```

**O que faz:**
- Cria tabelas: `customers`, `products`, `sales_items`, `crm_contacts`, `crm_activities`
- Cria views: `customer_sales_summary`, `product_sales_summary`, etc.
- Configura índices e RLS

#### 1.2. Migrar Tabela `sales` Existente
```bash
# Execute no SQL Editor:
/database/02-migration-sales-customer-id.sql
```

**O que faz:**
- Adiciona coluna `customer_id UUID` na tabela `sales`
- Adiciona colunas faltantes (`shipping_cost`, `tax`, etc.)
- Cria índice para `customer_id`

#### 1.3. Popular Clientes a partir de Vendas Existentes
```sql
-- Criar clientes a partir das vendas que já existem
INSERT INTO customers (name, email, phone, status, segment, first_purchase_at)
SELECT DISTINCT ON (customer_email)
  customer_name,
  customer_email,
  customer_phone,
  'active',
  'existing',
  MIN(created_at) OVER (PARTITION BY customer_email)
FROM sales
WHERE customer_email IS NOT NULL
  AND customer_email != 'email@naoinformado.com'
ON CONFLICT (email) DO NOTHING;

-- Atualizar customer_id nas vendas
UPDATE sales s
SET customer_id = c.id
FROM customers c
WHERE s.customer_email = c.email
  AND s.customer_id IS NULL;
```

#### 1.4. Popular Produtos a partir de Itens de Venda
```sql
-- Se você já tem sales_items com produtos, criar registros em products
INSERT INTO products (sku, name, price, category, is_active)
SELECT DISTINCT ON (product_sku)
  product_sku,
  product_name,
  MAX(price) as price,
  'subscription',
  true
FROM sales_items
WHERE product_sku IS NOT NULL
ON CONFLICT (sku) DO NOTHING;

-- Atualizar product_id nos itens
UPDATE sales_items si
SET product_id = p.id
FROM products p
WHERE si.product_sku = p.sku
  AND si.product_id IS NULL;
```

---

### **FASE 2: Atualizar Webhook** ⏱️ 5 min

#### 2.1. Substituir Arquivo do Webhook
```bash
# Renomear o atual (backup)
mv app/api/webhook/appmax/route.ts app/api/webhook/appmax/route-v3-backup.ts

# Copiar a nova versão
cp app/api/webhook/appmax/route-v4.ts.example app/api/webhook/appmax/route.ts
```

#### 2.2. Testar Webhook Localmente
```bash
# Rodar projeto
npm run dev

# Enviar webhook de teste
curl -X POST http://localhost:3000/api/webhook/appmax \
  -H "Content-Type: application/json" \
  -d '{
    "event": "OrderPaid",
    "id": "TEST-WEBHOOK-001",
    "customer": {
      "firstname": "João",
      "lastname": "Silva",
      "email": "joao@teste.com",
      "telephone": "11999999999"
    },
    "total": 297.00,
    "payment_method": "pix",
    "products": [{
      "id": "PROD-001",
      "sku": "voicepen-pro",
      "name": "VoicePen Pro - Anual",
      "price": 297.00,
      "qty": 1
    }]
  }'
```

#### 2.3. Verificar Criação de Dados
```sql
-- Verificar se criou cliente
SELECT * FROM customers ORDER BY created_at DESC LIMIT 1;

-- Verificar se criou produto
SELECT * FROM products ORDER BY created_at DESC LIMIT 1;

-- Verificar se criou venda
SELECT * FROM sales ORDER BY created_at DESC LIMIT 1;

-- Verificar se criou itens
SELECT * FROM sales_items ORDER BY created_at DESC LIMIT 1;

-- Verificar se criou contato CRM
SELECT * FROM crm_contacts ORDER BY created_at DESC LIMIT 1;
```

#### 2.4. Deploy para Produção
```bash
git add -A
git commit -m "feat: implementa webhook v4.0 com sincronização completa de dados"
git push
```

---

### **FASE 3: Atualizar Páginas do Dashboard** ⏱️ 20-30 min

Vou criar os arquivos atualizados para cada página do dashboard. Aguarde os próximos arquivos...

---

## 📊 Views Analíticas Criadas

### 1. `customer_sales_summary`
Resumo de vendas por cliente com métricas agregadas.

### 2. `product_sales_summary`
Resumo de vendas por produto com receita total.

### 3. `crm_funnel_summary`
Visão do funil de vendas CRM por estágio.

### 4. `sales_by_day`
Vendas agrupadas por dia.

### 5. `sales_by_source`
Vendas agrupadas por UTM source/campaign/medium.

---

## 🔧 Próximos Passos

1. ✅ Executar SQL de criação de tabelas
2. ✅ Executar migração de `sales`
3. ✅ Popular dados históricos (clientes e produtos)
4. ✅ Atualizar webhook para v4.0
5. ⏳ Atualizar página `/admin/customers`
6. ⏳ Atualizar página `/admin/products` (criar)
7. ⏳ Atualizar página `/admin/crm`
8. ⏳ Atualizar página `/admin/reports`

---

## ⚠️ Avisos Importantes

1. **Backup**: Sempre faça backup do banco antes de executar migrações
2. **Testes**: Teste o webhook v4.0 em ambiente local antes de fazer deploy
3. **Monitoramento**: Acompanhe os logs do Vercel após deploy para verificar se não há erros
4. **RLS**: As políticas RLS estão permissivas. Ajuste conforme sua estratégia de autenticação
5. **Performance**: As views analíticas podem ser lentas com muitos dados. Considere materialized views no futuro

---

## 📞 Suporte

Se encontrar erros durante a implementação:
1. Verifique os logs do Supabase (SQL Editor)
2. Verifique os logs do Vercel (Functions)
3. Verifique o console do navegador (Dashboard)
4. Confira se todas as variáveis de ambiente estão configuradas

---

**Status:** 🟡 Em Progresso - Aguardando criação das páginas do dashboard
