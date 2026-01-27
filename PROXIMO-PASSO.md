# ✅ CÓDIGO ATUALIZADO! PRÓXIMOS PASSOS

**Data:** 26/01/2026  
**Status:** Backend 100% pronto, falta configurar e testar

---

## 📦 O QUE FOI FEITO:

1. ✅ **SQL executado no Supabase**
   - Tabelas criadas: `sales`, `payment_attempts`, `webhook_logs`, `provisioning_queue`, `integration_logs`
   - Views: `vendas_recuperadas`, `pedidos_entrega_falhada`
   - Funções: `calcular_taxa_resgate()`, `estatisticas_conversao()`

2. ✅ **TypeScript atualizado**
   - `app/api/checkout/enterprise/route.ts` → usa `sale_id`
   - `lib/mercadopago-webhook-enterprise.ts` → usa `sale_id`
   - `lib/provisioning-worker.ts` → usa `sale_id`

---

## 🎯 PRÓXIMOS 3 PASSOS (VOCÊ FAZ):

### 1️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE (10 min)

**No Lovable (Edge Function):**
```
Settings > Environment Variables
EXTERNAL_API_SECRET = [gerar senha forte de 32 caracteres]
```

**Gerar senha:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**No `.env.local` (raiz do projeto):**
```bash
# Mercado Pago (https://www.mercadopago.com.br/developers/panel/app)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx-your-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx-your-public-key

# Lovable (MESMA SENHA configurada no Lovable acima!)
LOVABLE_API_SECRET=[mesma senha de 32 caracteres]
LOVABLE_API_URL=https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager

# AppMax (backup)
APPMAX_TOKEN=[seu token existente]
APPMAX_PRODUCT_ID=32880073

# Supabase
SUPABASE_SERVICE_ROLE_KEY=[seu service role key]
NEXT_PUBLIC_SUPABASE_URL=https://acouwzdniytqhaesgtpr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua anon key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (segurança)
CRON_SECRET=[gerar outra senha forte]
```

---

### 2️⃣ ATUALIZAR FRONTEND (30 min)

**Adicionar idempotencyKey no componente de checkout:**

```tsx
// No seu componente de checkout (ex: components/CheckoutForm.tsx)
import { useState } from 'react'

export function CheckoutForm() {
  // Gerar idempotencyKey UMA VEZ (na montagem do componente)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  
  async function handleSubmit(cardData: any) {
    const response = await fetch('/api/checkout/enterprise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey, // ✅ ADICIONAR
        customer: {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          cpf: '12345678900'
        },
        amount: 36.00,
        payment_method: 'credit_card',
        mpToken: cardData.token, // Token do MP SDK
        appmax_data: {
          payment_method: 'credit_card',
          card_data: cardData // Dados do cartão para AppMax
        }
      })
    })

    const result = await response.json()
    
    if (result.idempotent) {
      console.log('⚠️ Pagamento já processado!')
    }
    
    return result
  }

  // ... resto do componente
}
```

---

### 3️⃣ TESTAR (30 min)

**A) Health Check:**
```bash
curl http://localhost:3000/api/checkout/enterprise
# Deve retornar: { status: 'ok' }
```

**B) Teste de Idempotência:**
1. Abra o checkout
2. Clique "Pagar" 2x seguidas rapidamente
3. Verifique no console:
   - 1ª chamada: `{success: true, order_id: 'xxx'}`
   - 2ª chamada: `{success: true, idempotent: true, order_id: 'xxx'}`
4. Verifique no banco: **só 1 registro** em `sales` com aquele `idempotency_key`

**C) Teste de Cascata:**
1. Use cartão de teste MP que recusa por risco:
   ```
   Número: 5031 4332 1540 6351
   CVV: 123
   Validade: 11/25
   ```
2. Mercado Pago deve recusar
3. AppMax deve aprovar (se configurado)
4. Verifique no banco:
   ```sql
   SELECT * FROM sales WHERE fallback_used = true;
   SELECT * FROM payment_attempts ORDER BY created_at DESC;
   ```

**D) Teste de Provisioning:**
```bash
# Executar cron manualmente
curl http://localhost:3000/api/cron/process-provisioning

# Ver logs
SELECT * FROM provisioning_queue ORDER BY created_at DESC;
SELECT * FROM integration_logs ORDER BY created_at DESC;
```

---

## 📊 QUERIES ÚTEIS:

```sql
-- Ver todas as vendas
SELECT 
  id,
  customer_email,
  amount,
  order_status,
  payment_gateway,
  fallback_used,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 10;

-- Ver tentativas de pagamento
SELECT 
  pa.provider,
  pa.status,
  pa.rejection_code,
  s.customer_email,
  pa.created_at
FROM payment_attempts pa
JOIN sales s ON s.id = pa.sale_id
ORDER BY pa.created_at DESC
LIMIT 10;

-- Taxa de resgate
SELECT * FROM calcular_taxa_resgate();

-- Estatísticas dos últimos 30 dias
SELECT * FROM estatisticas_conversao(30);

-- Vendas recuperadas
SELECT * FROM vendas_recuperadas;
```

---

## 🚨 SE DER ERRO:

**Erro 1:** "idempotency_key violates unique constraint"
- ✅ Correto! Idempotência funcionando
- Cliente clicou 2x, sistema bloqueou duplicata

**Erro 2:** "column 'sale_id' does not exist"
- Execute o SQL de novo no Supabase
- Verifique se as tabelas foram criadas

**Erro 3:** "MERCADOPAGO_ACCESS_TOKEN não configurado"
- Adicione no `.env.local`
- Reinicie o servidor: `npm run dev`

**Erro 4:** "Lovable API retornou 401"
- Verifique se `LOVABLE_API_SECRET` é **igual** nos 2 lugares:
  1. Lovable Edge Function (Environment Variables)
  2. `.env.local` (LOVABLE_API_SECRET)

---

## 📞 PRÓXIMAS MELHORIAS (DEPOIS):

- [ ] Dashboard de métricas (taxa de resgate, conversão)
- [ ] Envio de email ao cliente (SendGrid/Resend)
- [ ] Admin para reprocessar pedidos falhados
- [ ] Notificações (Discord/Slack) quando cair na fila

---

**Boa sorte! Se precisar de ajuda, me chame!** 🚀
