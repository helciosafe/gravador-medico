# ✅ IMPLEMENTAÇÃO CONCLUÍDA - Mercado Pago + Cascata

## 📦 Arquivos Criados

### ✅ 1. `lib/mercadopago.ts` - PRONTO!
- ✅ PIX payment
- ✅ Credit Card payment  
- ✅ Card tokenization
- ✅ Get payment status
- ✅ Refund payment

---

## 🚀 Próximos Passos - Criar Agora

### Arquivo 1: `lib/payment-gateway-cascata.ts`

```bash
# Execute este comando para criar:
cat > "/Users/helciomattos/Desktop/GRAVADOR MEDICO/lib/payment-gateway-cascata.ts" << 'EOF'
import { processPayment as processMercadoPago, MercadoPagoPaymentData, MercadoPagoPaymentResult } from './mercadopago'
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

export interface GatewayAttempt {
  gateway: 'mercadopago' | 'appmax'
  success: boolean
  error?: string
  attempted_at: string
  response_time_ms: number
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

export async function processPaymentWithFallback(
  data: CascataPaymentData
): Promise<CascataPaymentResult> {
  const attempts: GatewayAttempt[] = []
  
  console.log('🔄 Iniciando checkout em cascata...')

  // TENTATIVA 1: MERCADO PAGO
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

    console.warn(`⚠️ Mercado Pago recusou: ${mpResult.error}`)
    console.log('🔄 Tentando fallback para AppMax...')

  } catch (mpError: any) {
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

  // TENTATIVA 2: APPMAX
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

    console.error('❌ AppMax também recusou')
    return {
      success: false,
      payment_id: '',
      gateway_used: 'appmax',
      attempts,
      error: 'Pagamento recusado por todos os gateways'
    }

  } catch (appmaxError: any) {
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
EOF
echo "✅ Arquivo cascata criado!"
```

---

### Arquivo 2: `lib/mercadopago-webhook.ts`

```bash
cat > "/Users/helciomattos/Desktop/GRAVADOR MEDICO/lib/mercadopago-webhook.ts" << 'EOF'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import { getPaymentStatus } from './mercadopago'
import { createLovableUser, generateSecurePassword } from '@/services/lovable-integration'

export async function handleMercadoPagoWebhook(request: NextRequest) {
  console.log('📨 Webhook Mercado Pago recebido')
  
  const body = await request.json()
  
  // Mercado Pago envia: { action: "payment.updated", data: { id: "12345" } }
  const { action, data } = body
  
  if (action && action.includes('payment')) {
    const paymentId = data.id
    
    console.log(`🔍 Consultando pagamento: ${paymentId}`)
    
    // Buscar detalhes do pagamento
    const payment = await getPaymentStatus(paymentId)
    
    console.log(`📊 Status: ${payment.status}`)
    
    // Atualizar no banco de dados
    const { data: sale, error } = await supabaseAdmin
      .from('sales')
      .update({
        status: mapStatus(payment.status),
        payment_details: payment
      })
      .eq('mercadopago_payment_id', paymentId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erro ao atualizar venda:', error)
      return
    }
    
    // Se aprovado, criar usuário no Lovable
    if (payment.status === 'approved' && sale) {
      console.log('✅ Pagamento aprovado! Criando usuário...')
      
      const password = generateSecurePassword()
      
      const userResult = await createLovableUser(
        sale.customer_email,
        password,
        sale.customer_name
      )
      
      if (userResult.success) {
        console.log('✅ Usuário criado no Lovable!')
        
        // TODO: Enviar email com credenciais
      }
    }
    
    return payment
  }
  
  return null
}

function mapStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    'approved': 'paid',
    'pending': 'pending',
    'in_process': 'pending',
    'rejected': 'refused',
    'cancelled': 'cancelled',
    'refunded': 'refunded'
  }
  return map[mpStatus] || 'pending'
}
EOF
echo "✅ Webhook handler criado!"
```

---

### Arquivo 3: `app/api/webhooks/mercadopago/route.ts`

```bash
mkdir -p "/Users/helciomattos/Desktop/GRAVADOR MEDICO/app/api/webhooks/mercadopago"
cat > "/Users/helciomattos/Desktop/GRAVADOR MEDICO/app/api/webhooks/mercadopago/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { handleMercadoPagoWebhook } from '@/lib/mercadopago-webhook'

export async function POST(request: NextRequest) {
  try {
    await handleMercadoPagoWebhook(request)
    
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: '/api/webhooks/mercadopago' 
  })
}
EOF
echo "✅ Route do webhook criada!"
```

---

## 🗄️ SQL para Banco de Dados

```sql
-- Execute no Supabase SQL Editor:

-- Adicionar colunas para cascata
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB,
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway 
ON public.sales(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id 
ON public.sales(mercadopago_payment_id);

-- Criar tabela de análise
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gateway_attempts JSONB NOT NULL,
    final_status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_email 
ON public.payment_attempts(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at 
ON public.payment_attempts(created_at DESC);

-- Comentários
COMMENT ON COLUMN public.sales.payment_gateway IS 'Gateway que aprovou: mercadopago ou appmax';
COMMENT ON COLUMN public.sales.gateway_attempts IS 'Histórico de tentativas em todos os gateways';
COMMENT ON TABLE public.payment_attempts IS 'Log de tentativas de pagamento (para análise)';
```

---

## ⚙️ Configurar `.env.local`

```bash
# Adicione ao seu .env.local:

# ========================================
# MERCADO PAGO
# ========================================
# Credenciais de TESTE (use primeiro para testar)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef123456789
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdef123456789

# Credenciais de PRODUÇÃO (comentar durante testes)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef123456789
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890-123456-abcdef123456789

# ========================================
# APPMAX (Manter - usado como fallback)
# ========================================
APPMAX_API_URL=https://admin.appmax.com.br/api/v3
APPMAX_API_TOKEN=B6C99C65-4FAE30A5-BB3DFD79-CCEDE0B7
APPMAX_PRODUCT_ID=32880073
```

---

## 📝 Como Testar

### 1. Testar Mercado Pago direto
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@teste.com",
    "phone": "11987654321",
    "cpf": "12345678900",
    "paymentMethod": "pix"
  }'
```

### 2. Ver logs
```bash
tail -f .next/server/app/api/checkout/route.js
```

---

## ✅ Status da Implementação

- [x] `lib/mercadopago.ts` ✅
- [ ] `lib/payment-gateway-cascata.ts` (execute comando acima)
- [ ] `lib/mercadopago-webhook.ts` (execute comando acima)
- [ ] `app/api/webhooks/mercadopago/route.ts` (execute comando acima)
- [ ] SQL no Supabase
- [ ] Configurar `.env.local`
- [ ] Atualizar `app/api/checkout/route.ts`

---

## 🎯 Mercado Pago: Qual API Escolher?

**✅ API de Pagamentos** (Checkout Transparente)
- Cliente fica no seu site
- Você controla tudo
- Melhor para conversão
- **É a que implementamos!**

❌ API de Orders (redireciona para MP)
- Cliente sai do site
- Menor conversão
- Não usar

---

## 📞 Próximo Passo

**Execute os 3 comandos bash acima** para criar:
1. Sistema de cascata
2. Webhook handler
3. Route do webhook

Depois me avise que eu atualizo o checkout API! 🚀
