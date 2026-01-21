# 🔔 Configuração de Webhooks AppMax

## 📍 URL do Webhook

Configure esta URL na AppMax para receber notificações:

```
https://SEU_DOMINIO.vercel.app/api/webhooks/appmax
```

**Exemplo (desenvolvimento):**
```
https://gravador-medico.vercel.app/api/webhooks/appmax
```

---

## ✅ Eventos que Devem Ser Configurados

Marque **TODOS** estes eventos na AppMax:

### 💰 Pagamentos
- [x] **Pedido aprovado** → Atualiza status: `approved`
- [x] **Pedido autorizado** → Atualiza status: `approved`
- [x] **Pedido pago** → Atualiza status: `paid`

### 🔵 PIX
- [x] **Pix Gerado** → Cria pedido: `pending`
- [x] **Pix Expirado** → Atualiza: `expired` + motivo: `PIX Expirado` ⚠️ **IMPORTANTE**
- [x] **Pix Pago** → Atualiza: `paid`

### 📄 Boleto
- [x] **Boleto Gerado** → Cria pedido: `pending`
- [x] **Pedido com boleto vencido** → Atualiza: `expired` + motivo: `Boleto Vencido`

### ⚠️ Problemas
- [x] **Pedido Estornado** → Atualiza: `refunded` + motivo: `Estornado`
- [x] **Pedido Chargeback em Tratamento** → Atualiza: `chargeback`
- [x] **Pedido Chargeback Ganho** → Atualiza: `approved` (remove motivo)

### ⏳ Status
- [x] **Pedido pendente de integração** → Atualiza: `pending`
- [x] **Pedido integrado** → Atualiza: `approved`
- [x] **Pedido Autorizado com atraso (60min)** → Atualiza: `approved`

### 💎 Upsells
- [x] **Upsell pago** → Cria nova venda: `paid`

---

## 🧪 Como Testar

### 1. Verificar Endpoint
```bash
curl https://SEU_DOMINIO.vercel.app/api/webhooks/appmax
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "endpoint": "AppMax Webhook Handler",
  "events_supported": [
    "Pedido aprovado",
    "Pix Expirado",
    ...
  ]
}
```

### 2. Testar PIX Expirado (Manual)

Simule o webhook enviando:

```bash
curl -X POST https://SEU_DOMINIO.vercel.app/api/webhooks/appmax \
  -H "Content-Type: application/json" \
  -d '{
    "event": "Pix Expirado",
    "order_id": "123456",
    "customer_email": "teste@exemplo.com",
    "payment_method": "pix"
  }'
```

**Resultado esperado:**
- Venda atualizada com `status = expired`
- Campo `failure_reason = 'PIX Expirado'`
- Carrinho marcado como `abandoned` novamente

### 3. Verificar no Dashboard

Acesse: `http://localhost:3000/admin/dashboard-v2`

No card **"Pagamentos Recusados"** você deve ver:
```
❌ Pagamentos Recusados
   R$ X.XXX
   Y tentativas falharam

   • PIX Expirado: 3
   • Boleto Vencido: 2
   • Cartão Recusado: 1
```

---

## 🗄️ Preparar Banco de Dados

Execute este SQL no Supabase **ANTES** de configurar os webhooks:

```sql
-- Adicionar coluna failure_reason
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_sales_failure_reason 
ON public.sales(failure_reason);
```

Ou execute o arquivo completo:
```
database/ADD-FAILURE-REASON.sql
```

---

## 📊 Estrutura do Payload

A AppMax envia webhooks neste formato (aproximado):

```json
{
  "event": "Pix Expirado",
  "order_id": "123456",
  "customer_email": "cliente@email.com",
  "customer_name": "João Silva",
  "total_amount": 197.00,
  "payment_method": "pix",
  "created_at": "2026-01-21T10:30:00Z"
}
```

**Campos importantes:**
- `event`: Nome exato do evento (deve estar na lista)
- `order_id`: ID do pedido para atualizar venda existente
- `customer_email`: Email para vincular carrinho abandonado

---

## 🔒 Segurança (Opcional)

Para validar que o webhook veio da AppMax, você pode:

1. **Verificar IP de origem** (se AppMax fornecer lista de IPs)
2. **Secret Key** (se AppMax enviar hash de validação)
3. **Timestamp** (rejeitar webhooks muito antigos)

Adicione validação no `route.ts` se necessário.

---

## ⚡ Fluxo Completo

### Cenário: Cliente cria PIX mas não paga

1. **Cliente acessa checkout** → Salva carrinho parcial
2. **Cliente gera PIX** → AppMax envia webhook "Pix Gerado"
   - Cria venda com `status: pending`
   - Atualiza carrinho para `status: recovered`

3. **PIX expira (15 min)** → AppMax envia webhook "Pix Expirado"
   - Atualiza venda: `status: expired`, `failure_reason: 'PIX Expirado'`
   - Reverte carrinho: `status: abandoned`

4. **Dashboard mostra:**
   - ✅ Card "Carrinhos Abandonados" +1
   - ❌ Card "Pagamentos Recusados" → "PIX Expirado: 1"

---

## 🐛 Troubleshooting

### Webhook não está sendo recebido
- Verifique se a URL está correta na AppMax
- Teste com `curl` manual
- Verifique logs no Vercel: `vercel logs --follow`

### Motivos não aparecem no dashboard
- Execute `database/ADD-FAILURE-REASON.sql`
- Verifique se `failure_reason` tem dados: 
  ```sql
  SELECT failure_reason, COUNT(*) 
  FROM sales 
  WHERE failure_reason IS NOT NULL 
  GROUP BY failure_reason;
  ```

### Carrinho não volta para "abandonado"
- Verifique se `customer_email` está correto no webhook
- Confirme que o status anterior era `recovered`

---

## 📝 Checklist de Implementação

- [ ] Executar SQL `ADD-FAILURE-REASON.sql` no Supabase
- [ ] Deploy da aplicação com webhook handler
- [ ] Configurar URL do webhook na AppMax
- [ ] Marcar todos os eventos listados acima
- [ ] Testar com PIX real (criar e deixar expirar)
- [ ] Verificar dashboard mostrando "PIX Expirado"
- [ ] Configurar segurança (opcional)

---

**Criado em:** 21/01/2026  
**Arquivo:** `WEBHOOK_APPMAX_CONFIG.md`  
**Endpoint:** `/api/webhooks/appmax`
