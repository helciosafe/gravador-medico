# 🔄 Migração Reversível: AppMax ↔️ Mercado Pago

## 🎯 Estratégia: Sistema Dual Gateway

Ao invés de substituir o AppMax, vamos criar um **sistema com 2 gateways em paralelo** que você pode alternar facilmente via configuração.

```
┌─────────────────────────────────────┐
│   Frontend (Checkout)               │
│   Seleciona gateway via .env        │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  PAYMENT_GATEWAY = "appmax" | "mp"   │  ← Variável de ambiente
└──────────────┬───────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐   ┌──────────────┐
│   AppMax   │   │ Mercado Pago │
│  (atual)   │   │    (novo)    │
└────────────┘   └──────────────┘
```

---

## 📦 Estrutura de Arquivos (Mantém tudo!)

### ✅ Arquivos Existentes (NÃO serão alterados)
```
lib/
  ├── appmax.ts                    ← Mantém intacto
  └── appmax-webhook.ts            ← Mantém intacto

app/api/
  ├── webhooks/appmax/route.ts     ← Mantém intacto
  └── checkout/
      ├── route.ts                 ← Vamos ADAPTAR (não substituir)
      └── route-appmax.backup.ts   ← Criar backup automático
```

### ✨ Novos Arquivos (Adicionar)
```
lib/
  ├── mercadopago.ts               ← NOVO
  ├── mercadopago-webhook.ts       ← NOVO
  └── payment-gateway.ts           ← NOVO (abstração)

app/api/
  ├── webhooks/mercadopago/route.ts ← NOVO
  └── checkout/
      └── route-unified.ts          ← NOVO (versão unificada)
```

---

## 🚀 Implementação em Etapas

### Etapa 1: Criar Abstração de Gateway

Criar **`lib/payment-gateway.ts`** que escolhe o gateway:

```typescript
/**
 * Abstração de Gateway de Pagamento
 * Permite alternar entre AppMax e Mercado Pago facilmente
 */

import { createAppmaxOrder } from './appmax'
import { processPayment as processMercadoPagoPayment } from './mercadopago'

export type PaymentGateway = 'appmax' | 'mercadopago'

export interface PaymentGatewayConfig {
  gateway: PaymentGateway
}

// Função para obter gateway ativo
export function getActiveGateway(): PaymentGateway {
  const gateway = process.env.PAYMENT_GATEWAY || 'appmax'
  return gateway as PaymentGateway
}

// Interface unificada de pagamento
export interface UnifiedPaymentData {
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  amount: number
  payment_method: 'pix' | 'credit_card'
  card_data?: any
  order_bumps?: any[]
  utm_params?: any
}

export interface UnifiedPaymentResult {
  success: boolean
  payment_id: string
  order_id?: string
  qr_code?: string
  qr_code_base64?: string
  error?: string
  gateway: PaymentGateway
}

/**
 * Processa pagamento no gateway ativo
 */
export async function processPayment(
  data: UnifiedPaymentData
): Promise<UnifiedPaymentResult> {
  const gateway = getActiveGateway()
  
  console.log(`💳 Gateway ativo: ${gateway.toUpperCase()}`)

  try {
    if (gateway === 'appmax') {
      return await processWithAppmax(data)
    } else {
      return await processWithMercadoPago(data)
    }
  } catch (error: any) {
    console.error(`❌ Erro no ${gateway}:`, error)
    return {
      success: false,
      payment_id: '',
      error: error.message,
      gateway
    }
  }
}

/**
 * Processar com AppMax (mantém lógica atual)
 */
async function processWithAppmax(
  data: UnifiedPaymentData
): Promise<UnifiedPaymentResult> {
  const result = await createAppmaxOrder({
    customer: data.customer,
    product_id: process.env.APPMAX_PRODUCT_ID || '',
    quantity: 1,
    payment_method: data.payment_method,
    order_bumps: data.order_bumps || [],
    card_data: data.card_data,
    utm_params: data.utm_params
  })

  return {
    success: result.success,
    payment_id: result.payment?.id || '',
    order_id: result.order?.id,
    qr_code: result.payment?.qr_code,
    qr_code_base64: result.payment?.qr_code_base64,
    gateway: 'appmax'
  }
}

/**
 * Processar com Mercado Pago
 */
async function processWithMercadoPago(
  data: UnifiedPaymentData
): Promise<UnifiedPaymentResult> {
  const result = await processMercadoPagoPayment({
    customer: data.customer,
    amount: data.amount,
    payment_method: data.payment_method,
    card_data: data.card_data
  })

  return {
    success: result.success,
    payment_id: result.payment_id,
    qr_code: result.qr_code,
    qr_code_base64: result.qr_code_base64,
    gateway: 'mercadopago'
  }
}
```

---

### Etapa 2: Atualizar Variáveis de Ambiente

**`.env.local`** (ou `.env.example`):

```bash
# ========================================
# GATEWAY DE PAGAMENTO ATIVO
# ========================================
# Valores: "appmax" ou "mercadopago"
# Para alternar, mude esta variável e reinicie o servidor
PAYMENT_GATEWAY=appmax

# ========================================
# APPMAX (Gateway Atual)
# ========================================
APPMAX_API_URL=https://admin.appmax.com.br/api/v3
APPMAX_API_TOKEN=B6C99C65-4FAE30A5-BB3DFD79-CCEDE0B7
APPMAX_PRODUCT_ID=32880073
APPMAX_ORDER_BUMP_1_ID=32989468
APPMAX_ORDER_BUMP_2_ID=32989503
APPMAX_ORDER_BUMP_3_ID=32989520
APPMAX_WEBHOOK_URL=https://www.gravadormedico.com.br/api/webhooks/appmax
APPMAX_WEBHOOK_SECRET=sua-chave-webhook-appmax

# ========================================
# MERCADO PAGO (Gateway Novo)
# ========================================
# Ambiente de TESTE
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdef123456789

# Ambiente de PRODUÇÃO (comentar quando testar)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef123456789
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890-123456-abcdef123456789

MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

---

### Etapa 3: Atualizar Checkout API (Versão Unificada)

**`app/api/checkout/route.ts`** - Adaptar para usar abstração:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processPayment, getActiveGateway } from '@/lib/payment-gateway'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const gateway = getActiveGateway()
    
    console.log(`🛒 Checkout iniciado com gateway: ${gateway.toUpperCase()}`)

    // Validações...
    if (!body.name || !body.email || !body.cpf) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Calcular total (order bumps + produto principal)
    const MAIN_PRODUCT_PRICE = 36
    const orderBumpsTotal = (body.orderBumps || []).reduce((sum: number, bump: any) => {
      const prices: Record<string, number> = {
        '32989468': 29.90,
        '32989503': 97,
        '32989520': 39.90
      }
      return sum + (prices[bump.product_id] || 0)
    }, 0)
    
    const amount = MAIN_PRODUCT_PRICE + orderBumpsTotal

    // Processar pagamento (abstração escolhe o gateway)
    const result = await processPayment({
      customer: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        cpf: body.cpf.replace(/\D/g, '')
      },
      amount,
      payment_method: body.paymentMethod === 'credit' ? 'credit_card' : 'pix',
      card_data: body.cardData,
      order_bumps: body.orderBumps,
      utm_params: body.utm_params
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Salvar no banco (independente do gateway)
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        customer_name: body.name,
        customer_email: body.email,
        customer_phone: body.phone,
        customer_cpf: body.cpf,
        total_amount: amount,
        payment_method: body.paymentMethod,
        status: 'pending',
        // Salva ID do gateway usado
        ...(gateway === 'appmax' 
          ? { appmax_order_id: result.order_id }
          : { mercadopago_payment_id: result.payment_id }
        ),
        payment_gateway: gateway, // Nova coluna (criar no banco)
        utm_source: body.utm_params?.utm_source,
        utm_medium: body.utm_params?.utm_medium,
        utm_campaign: body.utm_params?.utm_campaign
      })
      .select()
      .single()

    if (saleError) {
      console.error('❌ Erro ao salvar venda:', saleError)
    }

    // Retornar resposta unificada
    return NextResponse.json({
      success: true,
      payment_id: result.payment_id,
      order_id: result.order_id,
      qr_code: result.qr_code,
      qr_code_base64: result.qr_code_base64,
      gateway: result.gateway,
      sale_id: sale?.id
    })

  } catch (error: any) {
    console.error('❌ Erro no checkout:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

### Etapa 4: Atualizar Banco de Dados

**SQL para adicionar coluna de gateway**:

```sql
-- Adicionar coluna para identificar gateway usado
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax';

-- Adicionar coluna para Mercado Pago
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway 
ON public.sales(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id 
ON public.sales(mercadopago_payment_id);

-- Comentários
COMMENT ON COLUMN public.sales.payment_gateway IS 'Gateway usado: appmax ou mercadopago';
COMMENT ON COLUMN public.sales.appmax_order_id IS 'ID do pedido na AppMax (se gateway = appmax)';
COMMENT ON COLUMN public.sales.mercadopago_payment_id IS 'ID do pagamento no Mercado Pago (se gateway = mercadopago)';

-- Atualizar vendas existentes
UPDATE public.sales 
SET payment_gateway = 'appmax' 
WHERE appmax_order_id IS NOT NULL AND payment_gateway IS NULL;
```

---

### Etapa 5: Webhook Unificado (Opcional)

Criar **`app/api/webhooks/unified/route.ts`** que roteia para o webhook correto:

```typescript
import { NextRequest } from 'next/server'
import { handleAppmaxWebhook } from '@/lib/appmax-webhook'
import { handleMercadoPagoWebhook } from '@/lib/mercadopago-webhook'

export async function POST(request: NextRequest) {
  // Detectar gateway pelo header ou payload
  const signature = request.headers.get('x-appmax-signature')
  const mpSignature = request.headers.get('x-signature')
  
  if (signature) {
    console.log('📨 Webhook AppMax recebido')
    return (await handleAppmaxWebhook(request, '/api/webhooks/unified')).response
  } else if (mpSignature) {
    console.log('📨 Webhook Mercado Pago recebido')
    return await handleMercadoPagoWebhook(request)
  } else {
    // Fallback: tentar detectar pelo payload
    const body = await request.json()
    if (body.action || body.type) {
      // Mercado Pago
      return await handleMercadoPagoWebhook(request)
    } else {
      // AppMax
      return (await handleAppmaxWebhook(request, '/api/webhooks/unified')).response
    }
  }
}
```

---

## 🔄 Como Alternar Entre Gateways

### Para usar AppMax (atual)
```bash
# .env.local
PAYMENT_GATEWAY=appmax
```

### Para usar Mercado Pago
```bash
# .env.local
PAYMENT_GATEWAY=mercadopago
```

Depois reinicie o servidor:
```bash
npm run dev
```

---

## 📊 Dashboard: Ver Vendas por Gateway

Atualizar dashboard para mostrar gateway usado:

```typescript
// components/admin/SalesTable.tsx
<td className="px-4 py-3">
  <span className={`px-2 py-1 rounded text-xs ${
    sale.payment_gateway === 'appmax' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800'
  }`}>
    {sale.payment_gateway?.toUpperCase() || 'APPMAX'}
  </span>
</td>
```

---

## ✅ Vantagens desta Abordagem

| Item | Vantagem |
|------|----------|
| ✅ **Reversível** | Volta para AppMax mudando 1 variável |
| ✅ **Seguro** | Código AppMax intacto, funciona 100% |
| ✅ **Testável** | Testa MP em DEV, AppMax em PROD |
| ✅ **Zero Downtime** | Não precisa parar sistema |
| ✅ **A/B Testing** | Pode comparar conversão entre gateways |
| ✅ **Histórico** | Mantém dados de ambos os gateways |

---

## 🧪 Plano de Testes

### Fase 1: Desenvolvimento Local
```bash
# Testar AppMax (gateway atual)
PAYMENT_GATEWAY=appmax npm run dev

# Testar Mercado Pago (gateway novo)
PAYMENT_GATEWAY=mercadopago npm run dev
```

### Fase 2: Staging
- Deploy com `PAYMENT_GATEWAY=mercadopago`
- Testar checkout completo
- Validar webhook
- Comparar com AppMax

### Fase 3: Produção (Canary Deployment)
- **Semana 1**: 10% Mercado Pago, 90% AppMax
- **Semana 2**: 50% Mercado Pago, 50% AppMax
- **Semana 3**: 100% Mercado Pago

(Implementar logic de % via feature flag)

---

## 📝 Checklist de Implementação

### Preparação
- [ ] Criar backup completo do código atual
- [ ] Criar conta no Mercado Pago (teste)
- [ ] Obter credenciais de teste

### Desenvolvimento
- [ ] Criar `lib/payment-gateway.ts`
- [ ] Implementar `lib/mercadopago.ts`
- [ ] Criar `lib/mercadopago-webhook.ts`
- [ ] Atualizar `app/api/checkout/route.ts`
- [ ] Criar `app/api/webhooks/mercadopago/route.ts`
- [ ] Executar SQL no Supabase
- [ ] Atualizar `.env.local`

### Testes
- [ ] Testar AppMax (modo legacy)
- [ ] Testar Mercado Pago (modo novo)
- [ ] Alternar entre gateways 3x
- [ ] Validar webhooks de ambos

### Produção
- [ ] Deploy com `PAYMENT_GATEWAY=appmax` (mantém atual)
- [ ] Configurar webhook MP no painel
- [ ] Mudar para `PAYMENT_GATEWAY=mercadopago`
- [ ] Monitorar por 24h
- [ ] Se OK: manter MP | Se falhar: voltar AppMax

---

## 🆘 Rollback Instantâneo

Se algo der errado com Mercado Pago:

```bash
# 1. Editar .env.local
PAYMENT_GATEWAY=appmax

# 2. Reiniciar servidor
pm2 restart all
# ou
vercel redeploy
```

**Tempo de rollback**: < 1 minuto ⚡

---

## 📞 Próximos Passos

1. **Aprovar abordagem** - Ok usar sistema dual gateway?
2. **Começar implementação**:
   - Criar `lib/payment-gateway.ts`
   - Implementar `lib/mercadopago.ts` completo
   - Adaptar checkout API
   - Criar webhook MP
3. **Testar localmente** - Alternar entre gateways
4. **Deploy gradual** - Canary deployment em produção

**Quer que eu comece a implementação?** 🚀
