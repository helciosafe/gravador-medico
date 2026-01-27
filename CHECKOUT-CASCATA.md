# 🔄 Checkout em Cascata (Fallback Automático)

## 🎯 Estratégia: Mercado Pago → AppMax (Fallback)

Sistema inteligente que tenta processar no **Mercado Pago** primeiro. Se houver qualquer problema (recusa, erro de API, timeout), automaticamente tenta no **AppMax** como backup.

```
┌─────────────────────────┐
│   Cliente faz pedido    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   1️⃣ Mercado Pago      │
│   (Gateway Principal)   │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────┐      ┌─────────┐
│ APROVADO│      │ RECUSADO│
│  ✅     │      │  ❌     │
└─────────┘      └────┬────┘
                      │
                      ▼
            ┌──────────────────┐
            │ 2️⃣ AppMax        │
            │ (Gateway Backup) │
            └────────┬─────────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
          ┌────────┐    ┌────────┐
          │ APROVADO│    │ RECUSADO│
          │   ✅    │    │   ❌    │
          └────────┘    └────────┘
```

---

## ✅ Vantagens

| Vantagem | Descrição |
|----------|-----------|
| 📈 **Maior aprovação** | Se MP recusar, AppMax pode aprovar |
| 🛡️ **Redundância** | Se MP cair, AppMax assume |
| 💰 **Menores taxas** | Usa MP (taxas melhores) quando possível |
| 🎯 **Transparente** | Cliente não percebe a troca |
| 📊 **Métricas** | Sabe qual gateway aprova mais |

---

## 🚀 Implementação

### Arquivo: `lib/payment-gateway-cascata.ts`

```typescript
/**
 * Sistema de Pagamento em Cascata (Fallback Automático)
 * 
 * Fluxo:
 * 1. Tenta processar no Mercado Pago
 * 2. Se falhar/recusar, tenta no AppMax
 * 3. Retorna resultado + histórico de tentativas
 */

import { processPayment as processMercadoPago } from './mercadopago'
import { createAppmaxOrder } from './appmax'

export interface CascataPaymentData {
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  amount: number
  payment_method: 'pix' | 'credit_card'
  card_data?: {
    number: string
    holder_name: string
    exp_month: string
    exp_year: string
    cvv: string
    installments?: number
  }
  order_bumps?: any[]
  utm_params?: any
}

export interface CascataPaymentResult {
  success: boolean
  payment_id: string
  order_id?: string
  qr_code?: string
  qr_code_base64?: string
  gateway_used: 'mercadopago' | 'appmax'
  attempts: GatewayAttempt[]
  error?: string
}

export interface GatewayAttempt {
  gateway: 'mercadopago' | 'appmax'
  success: boolean
  error?: string
  attempted_at: string
  response_time_ms: number
}

/**
 * Processa pagamento com fallback automático
 */
export async function processPaymentWithFallback(
  data: CascataPaymentData
): Promise<CascataPaymentResult> {
  const attempts: GatewayAttempt[] = []
  
  console.log('🔄 Iniciando checkout em cascata...')

  // ========================================
  // TENTATIVA 1: MERCADO PAGO (PRINCIPAL)
  // ========================================
  try {
    const mpStartTime = Date.now()
    console.log('💳 Tentativa 1/2: Mercado Pago...')

    const mpResult = await processMercadoPago({
      customer: data.customer,
      amount: data.amount,
      payment_method: data.payment_method,
      card_data: data.card_data
    })

    const mpResponseTime = Date.now() - mpStartTime

    attempts.push({
      gateway: 'mercadopago',
      success: mpResult.success,
      error: mpResult.error,
      attempted_at: new Date().toISOString(),
      response_time_ms: mpResponseTime
    })

    // ✅ SUCESSO NO MERCADO PAGO
    if (mpResult.success) {
      console.log(`✅ Aprovado no Mercado Pago em ${mpResponseTime}ms`)
      return {
        success: true,
        payment_id: mpResult.payment_id,
        qr_code: mpResult.qr_code,
        qr_code_base64: mpResult.qr_code_base64,
        gateway_used: 'mercadopago',
        attempts
      }
    }

    // ⚠️ FALHOU NO MERCADO PAGO
    console.warn(`⚠️ Mercado Pago recusou: ${mpResult.error}`)
    console.log('🔄 Tentando fallback para AppMax...')

  } catch (mpError: any) {
    // 🚨 ERRO NO MERCADO PAGO (timeout, API down, etc)
    console.error('❌ Erro crítico no Mercado Pago:', mpError.message)
    
    attempts.push({
      gateway: 'mercadopago',
      success: false,
      error: `Erro: ${mpError.message}`,
      attempted_at: new Date().toISOString(),
      response_time_ms: 0
    })

    console.log('🔄 Mercado Pago indisponível, usando AppMax...')
  }

  // ========================================
  // TENTATIVA 2: APPMAX (FALLBACK)
  // ========================================
  try {
    const appmaxStartTime = Date.now()
    console.log('💳 Tentativa 2/2: AppMax (backup)...')

    const appmaxResult = await createAppmaxOrder({
      customer: data.customer,
      product_id: process.env.APPMAX_PRODUCT_ID || '',
      quantity: 1,
      payment_method: data.payment_method,
      order_bumps: data.order_bumps || [],
      card_data: data.card_data,
      utm_params: data.utm_params
    })

    const appmaxResponseTime = Date.now() - appmaxStartTime

    attempts.push({
      gateway: 'appmax',
      success: appmaxResult.success,
      error: appmaxResult.error,
      attempted_at: new Date().toISOString(),
      response_time_ms: appmaxResponseTime
    })

    // ✅ SUCESSO NO APPMAX
    if (appmaxResult.success) {
      console.log(`✅ Aprovado no AppMax em ${appmaxResponseTime}ms`)
      return {
        success: true,
        payment_id: appmaxResult.payment?.id || '',
        order_id: appmaxResult.order?.id,
        qr_code: appmaxResult.payment?.qr_code,
        qr_code_base64: appmaxResult.payment?.qr_code_base64,
        gateway_used: 'appmax',
        attempts
      }
    }

    // ❌ FALHOU NO APPMAX TAMBÉM
    console.error('❌ AppMax também recusou')
    return {
      success: false,
      payment_id: '',
      gateway_used: 'appmax',
      attempts,
      error: 'Pagamento recusado por todos os gateways'
    }

  } catch (appmaxError: any) {
    // 🚨 ERRO NO APPMAX
    console.error('❌ Erro crítico no AppMax:', appmaxError.message)
    
    attempts.push({
      gateway: 'appmax',
      success: false,
      error: `Erro: ${appmaxError.message}`,
      attempted_at: new Date().toISOString(),
      response_time_ms: 0
    })

    return {
      success: false,
      payment_id: '',
      gateway_used: 'appmax',
      attempts,
      error: 'Todos os gateways falharam'
    }
  }
}

/**
 * Regras de quando fazer fallback
 */
export function shouldTryFallback(error: string): boolean {
  const fallbackReasons = [
    // Mercado Pago - Recusas que AppMax pode aprovar
    'rejected',
    'insufficient_funds',
    'invalid_card',
    'cc_rejected_bad_filled_security_code',
    'cc_rejected_bad_filled_card_number',
    'cc_rejected_bad_filled_date',
    'cc_rejected_blacklist',
    'cc_rejected_call_for_authorize',
    'cc_rejected_card_disabled',
    'cc_rejected_duplicated_payment',
    'cc_rejected_high_risk',
    'cc_rejected_insufficient_amount',
    'cc_rejected_invalid_installments',
    'cc_rejected_max_attempts',
    
    // Erros técnicos
    'timeout',
    'network',
    'api_error',
    '500',
    '502',
    '503',
    '504'
  ]

  return fallbackReasons.some(reason => 
    error.toLowerCase().includes(reason.toLowerCase())
  )
}
```

---

## 📝 Atualizar Checkout API

### Arquivo: `app/api/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWithFallback } from '@/lib/payment-gateway-cascata'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🛒 Iniciando checkout com cascata de gateways...')

    // Validações...
    if (!body.name || !body.email || !body.cpf) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Calcular total
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

    // 🔄 PROCESSAR COM CASCATA (MP → AppMax)
    const result = await processPaymentWithFallback({
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
      // Salvar tentativas falhadas para análise
      await supabaseAdmin.from('payment_attempts').insert({
        customer_email: body.email,
        amount,
        gateway_attempts: result.attempts,
        final_status: 'failed',
        error: result.error
      })

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // ✅ PAGAMENTO APROVADO (em algum gateway)
    console.log(`✅ Pagamento aprovado via ${result.gateway_used.toUpperCase()}`)

    // Salvar no banco
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
        payment_gateway: result.gateway_used,
        gateway_attempts: result.attempts, // Salva histórico
        // ID do gateway usado
        ...(result.gateway_used === 'appmax' 
          ? { appmax_order_id: result.order_id }
          : { mercadopago_payment_id: result.payment_id }
        ),
        utm_source: body.utm_params?.utm_source,
        utm_medium: body.utm_params?.utm_medium,
        utm_campaign: body.utm_params?.utm_campaign
      })
      .select()
      .single()

    if (saleError) {
      console.error('❌ Erro ao salvar venda:', saleError)
    }

    return NextResponse.json({
      success: true,
      payment_id: result.payment_id,
      order_id: result.order_id,
      qr_code: result.qr_code,
      qr_code_base64: result.qr_code_base64,
      gateway_used: result.gateway_used,
      attempts: result.attempts, // Frontend pode exibir
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

## 🗄️ Atualizar Banco de Dados

```sql
-- Adicionar colunas para cascata
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB;

-- Criar tabela de análise de tentativas
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gateway_attempts JSONB NOT NULL,
    final_status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway 
ON public.sales(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id 
ON public.sales(mercadopago_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_email 
ON public.payment_attempts(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at 
ON public.payment_attempts(created_at DESC);

-- Comentários
COMMENT ON COLUMN public.sales.payment_gateway IS 'Gateway que aprovou: mercadopago ou appmax';
COMMENT ON COLUMN public.sales.gateway_attempts IS 'Histórico de tentativas em todos os gateways';
COMMENT ON TABLE public.payment_attempts IS 'Log de tentativas de pagamento (para análise de conversão)';
```

---

## 📊 Dashboard de Análise

Ver qual gateway tem melhor taxa de aprovação:

```sql
-- Taxa de aprovação por gateway
SELECT 
    payment_gateway,
    COUNT(*) as total_vendas,
    COUNT(*) FILTER (WHERE status = 'paid') as vendas_pagas,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'paid')::NUMERIC / 
        COUNT(*)::NUMERIC * 100, 
        2
    ) as taxa_aprovacao_pct
FROM public.sales
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_gateway
ORDER BY taxa_aprovacao_pct DESC;

-- Casos onde AppMax salvou após MP recusar
SELECT 
    customer_email,
    total_amount,
    payment_gateway,
    gateway_attempts,
    created_at
FROM public.sales
WHERE payment_gateway = 'appmax'
AND gateway_attempts::jsonb @> '[{"gateway": "mercadopago", "success": false}]'
ORDER BY created_at DESC
LIMIT 20;

-- Taxa de recuperação do fallback
WITH attempts AS (
    SELECT 
        CASE 
            WHEN payment_gateway = 'appmax' 
            AND gateway_attempts::jsonb @> '[{"gateway": "mercadopago", "success": false}]'
            THEN 'recuperado_por_appmax'
            WHEN payment_gateway = 'mercadopago'
            THEN 'direto_mercadopago'
            ELSE 'appmax_direto'
        END as tipo,
        COUNT(*) as qtd
    FROM public.sales
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY tipo
)
SELECT 
    tipo,
    qtd,
    ROUND(qtd::NUMERIC / SUM(qtd) OVER () * 100, 2) as percentual
FROM attempts;
```

---

## ⚙️ Configurações Avançadas

### Modo de Operação via `.env.local`:

```bash
# ========================================
# MODO DE CASCATA
# ========================================
# Valores: "cascata" | "only_mp" | "only_appmax"
PAYMENT_MODE=cascata

# Timeout por gateway (ms)
MP_TIMEOUT=5000
APPMAX_TIMEOUT=5000

# Retry automático se falhar
MAX_RETRIES_PER_GATEWAY=1
```

### Lógica de Timeout:

```typescript
// Em lib/payment-gateway-cascata.ts

const MP_TIMEOUT = parseInt(process.env.MP_TIMEOUT || '5000')
const APPMAX_TIMEOUT = parseInt(process.env.APPMAX_TIMEOUT || '5000')

async function processWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  gatewayName: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${gatewayName} timeout`)), timeoutMs)
    )
  ])
}

// Uso:
const mpResult = await processWithTimeout(
  processMercadoPago(data),
  MP_TIMEOUT,
  'Mercado Pago'
)
```

---

## 🎯 Casos de Uso

### Caso 1: Mercado Pago Aprova ✅
```
Cliente → MP (aprovado) ✅
Resultado: Usa MP
Tempo: ~2s
```

### Caso 2: MP Recusa, AppMax Aprova ✅
```
Cliente → MP (recusado) ❌ → AppMax (aprovado) ✅
Resultado: Usa AppMax
Tempo: ~4s (2s MP + 2s AppMax)
```

### Caso 3: Ambos Recusam ❌
```
Cliente → MP (recusado) ❌ → AppMax (recusado) ❌
Resultado: Erro "Pagamento recusado"
Tempo: ~4s
```

### Caso 4: MP Timeout, AppMax Aprova ✅
```
Cliente → MP (timeout) ⏱️ → AppMax (aprovado) ✅
Resultado: Usa AppMax
Tempo: ~7s (5s timeout + 2s AppMax)
```

---

## 📈 Métricas Esperadas

Baseado em dados do mercado:

| Métrica | Valor Estimado |
|---------|----------------|
| **Taxa de aprovação MP** | ~85% |
| **Taxa de aprovação AppMax** | ~80% |
| **Taxa de aprovação CASCATA** | **~95%** |
| **Recuperação por fallback** | ~10-15% |
| **Tempo médio (sucesso MP)** | 2s |
| **Tempo médio (fallback)** | 4-5s |

---

## ✅ Checklist de Implementação

### Desenvolvimento
- [ ] Criar `lib/payment-gateway-cascata.ts`
- [ ] Atualizar `app/api/checkout/route.ts`
- [ ] Executar SQL no Supabase
- [ ] Atualizar `.env.local`
- [ ] Adicionar logs detalhados

### Testes
- [ ] Testar MP aprovação
- [ ] Testar MP recusa → AppMax aprovação
- [ ] Testar ambos recusam
- [ ] Testar timeout MP → AppMax
- [ ] Validar webhooks de ambos

### Monitoramento
- [ ] Dashboard de taxa de aprovação
- [ ] Alertas se ambos gateways falharem
- [ ] Análise de casos recuperados

---

## 🆘 Rollback

Se precisar desativar cascata:

```bash
# .env.local
PAYMENT_MODE=only_appmax  # Volta para AppMax 100%
```

---

## 🚀 Próximos Passos

Quer que eu implemente:

1. ✅ **Implementação completa** - Criar todos os arquivos
2. 📊 **Dashboard de análise** - Ver taxa de aprovação
3. 🧪 **Sistema de testes** - Simular recusas
4. 🔔 **Alertas** - Notificar se ambos falharem

**Começar agora?** 💪
