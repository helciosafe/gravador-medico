# 🔄 Migração AppMax → Mercado Pago

## 📋 Índice
- [Visão Geral](#visão-geral)
- [O que será alterado](#o-que-será-alterado)
- [Passo a passo da migração](#passo-a-passo-da-migração)
- [Configuração Mercado Pago](#configuração-mercado-pago)
- [Alterações no código](#alterações-no-código)
- [Testes](#testes)

---

## 🎯 Visão Geral

### Integração Atual (AppMax)
```
Frontend (checkout) → API /checkout → lib/appmax.ts → AppMax API
                                   ↓
                            Webhook AppMax → /api/webhooks/appmax
```

### Nova Integração (Mercado Pago)
```
Frontend (checkout) → API /checkout → lib/mercadopago.ts → Mercado Pago API
                                   ↓
                      Webhook Mercado Pago → /api/webhooks/mercadopago
```

---

## 📦 O que será alterado

### Arquivos a Modificar
- ✏️ `lib/mercadopago.ts` - Completar integração
- ✏️ `app/api/checkout/route.ts` - Trocar AppMax por Mercado Pago
- ✏️ `app/checkout/page.tsx` - Ajustar lógica de pagamento (se necessário)
- ✏️ `.env.local` - Adicionar credenciais Mercado Pago
- ✅ Criar `app/api/webhooks/mercadopago/route.ts` - Novo webhook

### Banco de Dados
- 🗄️ Adicionar coluna `mercadopago_payment_id` na tabela `sales`
- 🗄️ Manter `appmax_order_id` como opcional (para histórico)

### Arquivos a Remover (depois dos testes)
- ❌ `lib/appmax.ts` (manter backup)
- ❌ `app/api/webhooks/appmax/route.ts` (manter backup)
- ❌ `lib/appmax-webhook.ts` (manter backup)

---

## 🚀 Passo a passo da migração

### Etapa 1: Configuração Mercado Pago

#### 1.1 Criar conta
1. Acesse: https://www.mercadopago.com.br
2. Crie uma conta (ou faça login)
3. Acesse o painel: https://www.mercadopago.com.br/developers/panel

#### 1.2 Obter credenciais de TESTE
1. Vá em **"Suas integrações"** → **"Credenciais"**
2. **Ambiente de Teste**:
   - `TEST-xxxxxxxx` (Access Token)
   - `TEST-xxxxxxxx` (Public Key)

#### 1.3 Obter credenciais de PRODUÇÃO
1. Vá em **"Suas integrações"** → **"Credenciais"**
2. **Ambiente de Produção**:
   - `APP_USR-xxxxxxxx` (Access Token)
   - `APP_USR-xxxxxxxx` (Public Key)

#### 1.4 Configurar Webhook
1. Vá em **"Webhooks"**: https://www.mercadopago.com.br/developers/panel/webhooks
2. Clique em **"Configurar notificações"**
3. URL: `https://www.gravadormedico.com.br/api/webhooks/mercadopago`
4. Eventos:
   - ✅ `payment` (pagamentos)
   - ✅ `merchant_order` (pedidos)

---

### Etapa 2: Variáveis de Ambiente

Edite `.env.local` (ou crie se não existir):

```bash
# ========================================
# MERCADO PAGO - Gateway de Pagamento
# ========================================

# Ambiente de TESTE
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456-123456-abcdef123456789
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST_USR-1234567890123456-123456-abcdef123456789

# Ambiente de PRODUÇÃO (comentar quando testar)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456-123456-abcdef123456789
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890123456-123456-abcdef123456789

# Webhook Secret (opcional - para validar assinatura)
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# ========================================
# APPMAX (Manter comentado - backup)
# ========================================
# APPMAX_API_URL=https://admin.appmax.com.br/api/v3
# APPMAX_API_TOKEN=B6C99C65-4FAE30A5-BB3DFD79-CCEDE0B7
# APPMAX_PRODUCT_ID=32880073
```

---

### Etapa 3: Atualizar Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Adicionar coluna para Payment ID do Mercado Pago
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id 
ON public.sales(mercadopago_payment_id);

-- Comentar: Manter appmax_order_id para histórico
COMMENT ON COLUMN public.sales.appmax_order_id IS 'ID do pedido na AppMax (LEGADO - migrado para Mercado Pago em Jan/2026)';
COMMENT ON COLUMN public.sales.mercadopago_payment_id IS 'ID do pagamento no Mercado Pago';

-- Ver estrutura atualizada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
AND column_name IN ('appmax_order_id', 'mercadopago_payment_id');
```

---

## 📝 Alterações no Código

### 1. Completar `lib/mercadopago.ts`

Vou criar a versão completa com:
- ✅ Criar pagamento PIX
- ✅ Criar pagamento Cartão
- ✅ Consultar status
- ✅ Webhook handler
- ✅ Estorno (refund)

### 2. Atualizar `app/api/checkout/route.ts`

Trocar:
```typescript
import { createAppmaxOrder } from '@/lib/appmax'
```

Por:
```typescript
import { processPayment } from '@/lib/mercadopago'
```

### 3. Criar `app/api/webhooks/mercadopago/route.ts`

Webhook para receber notificações do Mercado Pago.

---

## 🔍 Comparação de Recursos

| Recurso | AppMax | Mercado Pago |
|---------|--------|--------------|
| **PIX** | ✅ | ✅ |
| **Cartão** | ✅ | ✅ |
| **Boleto** | ✅ | ✅ |
| **Parcelamento** | Até 12x | Até 12x |
| **Taxa** | ~4.99% | ~4.99% |
| **Webhook** | ✅ | ✅ |
| **Estorno** | ✅ | ✅ |
| **Order Bumps** | ✅ Nativo | 🔄 Manual |
| **Documentação** | Regular | Excelente |
| **SDK** | ❌ | ✅ Completo |

---

## ⚠️ Pontos de Atenção

### Order Bumps
- **AppMax**: Suporta nativamente via `order_bumps[]`
- **Mercado Pago**: Deve somar tudo em um único `amount`

**Solução**: Calcular total no backend antes de enviar para MP.

### IDs de Referência
- **AppMax**: `appmax_order_id` (gerado por eles)
- **Mercado Pago**: `mercadopago_payment_id` + `external_reference` (nosso)

**Solução**: Usar `external_reference` com UUID próprio.

### Webhook Payload
- **AppMax**: Formato customizado
- **Mercado Pago**: Formato padrão da API

**Solução**: Adaptar parser do webhook.

---

## ✅ Checklist de Migração

### Antes de começar
- [ ] Backup completo do código atual
- [ ] Backup do banco de dados
- [ ] Criar conta no Mercado Pago
- [ ] Obter credenciais de TESTE

### Desenvolvimento
- [ ] Atualizar `.env.local` com credenciais MP
- [ ] Executar SQL para adicionar coluna `mercadopago_payment_id`
- [ ] Implementar `lib/mercadopago.ts` completo
- [ ] Atualizar `app/api/checkout/route.ts`
- [ ] Criar `app/api/webhooks/mercadopago/route.ts`
- [ ] Testar PIX em ambiente de teste
- [ ] Testar Cartão em ambiente de teste
- [ ] Testar Webhook em ambiente de teste

### Produção
- [ ] Obter credenciais de PRODUÇÃO
- [ ] Atualizar `.env.local` com credenciais de PRODUÇÃO
- [ ] Configurar Webhook no painel do MP
- [ ] Fazer deploy
- [ ] Testar em produção com valores baixos
- [ ] Monitorar logs por 24h

### Pós-migração
- [ ] Arquivar código AppMax (não deletar ainda)
- [ ] Atualizar documentação
- [ ] Notificar time/clientes (se aplicável)

---

## 🧪 Testes

### Teste 1: PIX
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com",
    "phone": "11987654321",
    "cpf": "12345678900",
    "paymentMethod": "pix",
    "orderBumps": []
  }'
```

Esperado:
```json
{
  "success": true,
  "payment_id": "1234567890",
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64..."
}
```

### Teste 2: Cartão
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@teste.com",
    "phone": "11987654321",
    "cpf": "12345678900",
    "paymentMethod": "credit",
    "cardData": {
      "number": "4235647728025682",
      "holderName": "MARIA SANTOS",
      "expMonth": "12",
      "expYear": "2025",
      "cvv": "123",
      "installments": 1
    }
  }'
```

### Teste 3: Webhook
Simular notificação:
```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "1234567890"
    }
  }'
```

---

## 📞 Próximos Passos

1. **Confirme** se quer prosseguir com a migração
2. **Escolha** começar por:
   - 🎯 Implementação completa (vou criar todos os arquivos)
   - 📚 Apenas documentação detalhada
   - 🧪 Primeiro testar em ambiente isolado

---

## 🆘 Suporte

Se tiver dúvidas durante a migração:
- 📖 Documentação MP: https://www.mercadopago.com.br/developers/pt/docs
- 💬 Suporte MP: https://www.mercadopago.com.br/developers/panel/support
- 🔍 Logs do Webhook: https://www.mercadopago.com.br/developers/panel/webhooks

---

**Última atualização**: 26/01/2026
**Status**: Pronto para começar 🚀
