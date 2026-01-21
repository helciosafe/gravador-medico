# ✅ CHECKLIST DE VALIDAÇÃO PÓS-REFACTOR

## 🎯 VALIDAÇÃO DAS QUERIES

### 1. Testar `fetchDashboardMetrics`
```typescript
// No console do Supabase SQL Editor ou no seu código:
SELECT * FROM analytics_health;
```

**O que verificar:**
- [ ] Retorna 1 linha com todos os campos
- [ ] `revenue` > 0 (se houver vendas)
- [ ] `conversion_rate` está entre 0-100
- [ ] `revenue_change`, `aov_change` são números (podem ser negativos)

---

### 2. Testar `fetchSalesBySource`
```sql
SELECT * FROM marketing_attribution ORDER BY total_revenue DESC LIMIT 10;
```

**O que verificar:**
- [ ] Retorna múltiplas linhas (uma por fonte/meio/campanha)
- [ ] Campo `source` não é NULL
- [ ] `total_revenue` está ordenado DESC
- [ ] `primary_device` é 'mobile', 'tablet' ou 'desktop'

---

### 3. Testar `fetchTopProducts`
```sql
SELECT * FROM product_performance ORDER BY total_revenue DESC LIMIT 5;
```

**O que verificar:**
- [ ] Retorna até 5 produtos
- [ ] `total_revenue` > 0
- [ ] `product_name` e `product_sku` preenchidos

---

### 4. Testar `fetchVisitorsOnline`
```sql
SELECT * FROM analytics_visitors_online;
```

**O que verificar:**
- [ ] Retorna 1 linha
- [ ] `online_count` >= 0
- [ ] `mobile_count + desktop_count` <= `online_count`

---

## 🔍 VALIDAÇÃO DO ANALYTICS TRACKING

### 1. Verificar se o Hook está ativo
**Passos:**
1. Abra a aplicação em uma aba anônima
2. Abra o DevTools → Console
3. NÃO deve ver logs de "✅ Analytics heartbeat enviado" (removemos)
4. Abra DevTools → Network → Filter: "analytics_visits"
5. Deve ver requests de UPSERT a cada 30 segundos

---

### 2. Validar UTMs
**Teste:**
```
https://seusite.com/?utm_source=google&utm_medium=cpc&utm_campaign=teste-refactor
```

**Query de validação:**
```sql
SELECT 
  session_id, 
  utm_source, 
  utm_medium, 
  utm_campaign, 
  device_type,
  referrer_domain
FROM analytics_visits 
WHERE utm_campaign = 'teste-refactor'
ORDER BY created_at DESC
LIMIT 1;
```

**O que verificar:**
- [ ] `utm_source` = 'google'
- [ ] `utm_medium` = 'cpc'
- [ ] `utm_campaign` = 'teste-refactor'
- [ ] `device_type` = 'mobile' | 'tablet' | 'desktop' (baseado no seu device)
- [ ] `referrer_domain` pode ser NULL (se acesso direto)

---

### 3. Validar Device Detection
**Teste:**
1. Abra em Desktop (> 1024px) → deve gravar `device_type = 'desktop'`
2. Abra em Tablet (768-1023px) → deve gravar `device_type = 'tablet'`
3. Abra em Mobile (< 768px) → deve gravar `device_type = 'mobile'`

**Query:**
```sql
SELECT device_type, COUNT(*) 
FROM analytics_visits 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY device_type;
```

---

## 🎨 VALIDAÇÃO DO FRONTEND

### 1. BigNumbers Component
**Passos:**
1. Abra a página do Dashboard
2. Os 4 cards devem mostrar:
   - **Faturamento Bruto** (R$ formatado)
   - **Ticket Médio** (R$ formatado)
   - **Taxa de Conversão** (%)
   - **Total de Vendas** (número inteiro)
3. As setas (TrendingUp/Down) devem aparecer se delta != 0
4. Estado de loading deve funcionar

**O que NÃO pode ter:**
- [ ] Cálculos de `.reduce()` ou `.map()` para somar valores
- [ ] Objetos `{current, previous}`
- [ ] Comparações manuais de períodos

---

### 2. RealtimeVisitors Widget
**Passos:**
1. Abra o Dashboard
2. O número de visitantes deve atualizar a cada 5 segundos
3. O "pulse" verde deve estar animado
4. Mobile + Desktop counts devem ser exibidos

**Teste de Stress:**
1. Abra 3 abas diferentes do site (em janelas anônimas)
2. Aguarde 10 segundos
3. `online_count` deve aumentar (se as views estiverem corretas)

---

## 🐛 TROUBLESHOOTING

### ❌ Erro: "analytics_health does not exist"
**Solução:**
```sql
-- Execute no Supabase SQL Editor
CREATE OR REPLACE VIEW public.analytics_health AS
-- (cole o código da view do arquivo supabase-analytics-advanced.sql)
```

---

### ❌ BigNumbers mostra `NaN` ou `undefined`
**Causa:** View retorna NULL para campos calculados.

**Diagnóstico:**
```sql
SELECT * FROM analytics_health;
-- Se retornar NULL, pode ser que não há dados suficientes
```

**Fix temporário no código:**
```typescript
<BigNumbers 
  metrics={{
    revenue: metrics?.revenue || 0,
    sales: metrics?.sales || 0,
    // ...
  }}
/>
```

---

### ❌ Marketing Attribution vazio
**Causa:** Nenhum visitante com UTMs registrado.

**Solução:**
1. Acesse o site com UTMs: `/?utm_source=teste&utm_medium=refactor`
2. Aguarde 30 segundos (heartbeat)
3. Faça uma compra de teste
4. Aguarde 24h (ou ajuste a view para janela menor)

**View alternativa para testes:**
```sql
-- Modificar temporariamente para 1 hora em vez de 24h
LEFT JOIN completed_sales cs ON 
  cs.created_at BETWEEN ts.created_at AND (ts.created_at + INTERVAL '1 hour')
```

---

### ❌ Visitantes Online sempre 0
**Causa:** Nenhum visitante ativo nos últimos 5 minutos.

**Diagnóstico:**
```sql
SELECT 
  session_id, 
  last_seen, 
  is_online,
  NOW() - last_seen as seconds_ago
FROM analytics_visits 
WHERE is_online = true
ORDER BY last_seen DESC;
```

**Se `last_seen` > 5 min, o heartbeat pode estar quebrado.**

**Fix:**
1. Verifique se `useAnalytics()` está no layout.tsx correto
2. Verifique se NÃO está em `/admin` (que ignora tracking)
3. Limpe sessionStorage e recarregue

---

## 📊 QUERIES ÚTEIS PARA DEBUG

### Ver todas as sessões ativas
```sql
SELECT 
  session_id,
  page_path,
  device_type,
  utm_source,
  last_seen,
  EXTRACT(EPOCH FROM (NOW() - last_seen)) as seconds_ago
FROM analytics_visits
WHERE is_online = true
ORDER BY last_seen DESC;
```

### Ver atribuição completa (raw)
```sql
SELECT 
  av.utm_source,
  av.utm_medium,
  ca.customer_email,
  ca.total_amount,
  ca.status,
  ca.created_at as sale_date,
  av.created_at as visit_date
FROM analytics_visits av
LEFT JOIN checkout_attempts ca ON 
  ca.created_at BETWEEN av.created_at AND av.created_at + INTERVAL '24 hours'
WHERE av.utm_source IS NOT NULL
ORDER BY av.created_at DESC
LIMIT 20;
```

### Testar funil manualmente
```sql
SELECT
  (SELECT COUNT(DISTINCT session_id) FROM analytics_visits WHERE created_at > NOW() - INTERVAL '7 days') as visitors,
  (SELECT COUNT(*) FROM checkout_attempts WHERE created_at > NOW() - INTERVAL '7 days') as checkouts,
  (SELECT COUNT(*) FROM checkout_attempts WHERE status IN ('paid', 'approved') AND created_at > NOW() - INTERVAL '7 days') as sales;
```

---

## ✅ CHECKLIST FINAL

- [ ] Todas as views SQL foram criadas no Supabase
- [ ] `fetchDashboardMetrics()` retorna dados corretos
- [ ] `fetchSalesBySource()` retorna atribuição de marketing
- [ ] `fetchTopProducts()` retorna produtos ordenados por receita
- [ ] `BigNumbers` exibe os 4 cards sem erros
- [ ] `RealtimeVisitors` atualiza a cada 5 segundos
- [ ] UTMs são capturados corretamente
- [ ] Device Type é detectado (mobile/tablet/desktop)
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro de TypeScript ao compilar

---

**Se todos os itens acima estão ✅, o refactor está completo e PRONTO PARA PRODUÇÃO!**
