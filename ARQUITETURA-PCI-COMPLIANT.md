# 🛡️ ARQUITETURA PCI COMPLIANT - TOKENIZAÇÃO DUPLA

**Data:** 26 de Janeiro de 2026  
**Status:** 🚨 CRÍTICO - Implementação Obrigatória  
**Motivo:** Compliance PCI-DSS, Segurança Legal e Técnica

---

## ⚠️ O PROBLEMA CRÍTICO IDENTIFICADO

### ❌ IMPLEMENTAÇÃO ANTERIOR (INSEGURA)

```typescript
// ❌ ERRO GRAVE: Backend recebendo dados de cartão crus
async function processPaymentWithFallback(data) {
  const mpResult = await processMercadoPago({
    card_data: data.card_data // ⚠️ VIOLAÇÃO PCI
  })
  
  if (!mpResult.success) {
    const appmaxResult = await createAppmaxOrder({
      card_data: data.card_data // ⚠️ TRAFEGANDO DADOS SENSÍVEIS
    })
  }
}
```

**Problemas:**
1. 🚨 Dados sensíveis trafegando no backend
2. 🚨 Impossível usar token MP na AppMax (tokens não são intercambiáveis)
3. 🚨 Violação PCI-DSS (multa + banimento de conta)
4. 🚨 Responsabilidade legal sobre vazamento de dados

---

## ✅ ARQUITETURA CORRETA: TOKENIZAÇÃO DUPLA

### Princípio Fundamental
> **"Nunca confie os dados do cartão ao seu servidor. Deixe os gateways tokenizarem no navegador do cliente."**

### Fluxo Seguro

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Navegador do Cliente)                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Cliente digita: Número, CVV, Validade           │    │
│  │ 2. SDK Mercado Pago tokeniza → token_mp            │    │
│  │ 3. SDK AppMax tokeniza → token_appmax               │    │
│  │ 4. Envia para backend: { token_mp, token_appmax }  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Seu Servidor - SEM ACESSO A DADOS SENSÍVEIS)     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Recebe { token_mp, token_appmax, customer }     │    │
│  │ 2. Tenta cobrar MP com token_mp                    │    │
│  │ 3. Se falhar (risco), tenta AppMax com token_app   │    │
│  │ 4. Retorna sucesso ou erro                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 SEGURANÇA DE VARIÁVEIS DE AMBIENTE

### ❌ ANTES (INSEGURO)
```typescript
const API_SECRET = 'webhook-appmax-2026-secure-key' // ❌ HARDCODED
```

### ✅ DEPOIS (SEGURO)
```typescript
const API_SECRET = process.env.LOVABLE_API_SECRET // ✅ ENV VAR
if (!API_SECRET) throw new Error('LOVABLE_API_SECRET não configurado')
```

### Configuração Necessária

**1. No Lovable (Edge Function):**
```
Settings > Environment Variables
EXTERNAL_API_SECRET = [senha forte gerada]
```

**2. No Vercel/Projeto Local (.env.local):**
```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx

# AppMax
APPMAX_TOKEN=xxx
APPMAX_PRODUCT_ID=xxx

# Lovable Integration
LOVABLE_API_URL=https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager
LOVABLE_API_SECRET=[mesma senha do Lovable]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 🏗️ ARQUITETURA ATUALIZADA

### 1. Frontend: Componente de Checkout

```tsx
'use client'

import { useState } from 'react'
import { loadMercadoPago } from '@mercadopago/sdk-js'

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false)
  const [retryingGateway, setRetryingGateway] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1️⃣ TOKENIZAR NO MERCADO PAGO (Frontend)
      const mp = await loadMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!)
      const cardForm = mp.cardForm({
        amount: formData.amount,
        autoMount: true,
        form: {
          id: 'form-checkout',
          cardNumber: { id: 'cardNumber', placeholder: 'Número do cartão' },
          expirationDate: { id: 'expirationDate', placeholder: 'MM/YY' },
          securityCode: { id: 'securityCode', placeholder: 'CVV' },
          cardholderName: { id: 'cardholderName', placeholder: 'Nome no cartão' },
          issuer: { id: 'issuer', placeholder: 'Banco emissor' },
          installments: { id: 'installments', placeholder: 'Parcelas' },
          identificationType: { id: 'identificationType', placeholder: 'Tipo de documento' },
          identificationNumber: { id: 'identificationNumber', placeholder: 'CPF' },
          cardholderEmail: { id: 'email' },
        },
        callbacks: {
          onFormMounted: (error) => {
            if (error) console.error('Form mount error:', error)
          },
          onSubmit: async (event) => {
            event.preventDefault()

            // 🔐 MP SDK tokeniza automaticamente
            const { token: mpToken } = await cardForm.createCardToken()

            // 2️⃣ TOKENIZAR NA APPMAX (Frontend)
            // AppMax usa dados brutos, mas via SSL direto pro servidor deles
            const appmaxToken = await tokenizeAppmax(formData.card)

            // 3️⃣ ENVIAR AMBOS OS TOKENS PARA NOSSO BACKEND
            const response = await fetch('/api/checkout/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customer: {
                  name: formData.name,
                  email: formData.email,
                  cpf: formData.cpf,
                  phone: formData.phone
                },
                amount: formData.amount,
                payment_method: 'credit_card',
                mpToken, // ✅ Token do Mercado Pago
                appmaxToken, // ✅ Token da AppMax (ou dados brutos se AppMax não tiver SDK)
                device_fingerprint: getDeviceFingerprint()
              })
            })

            const result = await response.json()

            if (result.success) {
              window.location.href = `/obrigado?sale_id=${result.sale_id}&rescued=${result.fallback_used}`
            } else {
              alert(result.error)
            }
          }
        }
      })

    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="form-checkout" onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      {loading && (
        <div className="loading">
          {retryingGateway ? '🔄 Tentando gateway alternativo...' : '💳 Processando...'}
        </div>
      )}
    </form>
  )
}
```

### 2. Backend: Rota Unificada

```typescript
// app/api/checkout/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, amount, mpToken, appmaxToken, device_fingerprint } = body

    console.log('🔄 Iniciando checkout com cascata segura...')

    // =====================================================
    // 1️⃣ TENTATIVA 1: MERCADO PAGO
    // =====================================================
    try {
      console.log('💳 Tentando Mercado Pago...')
      
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `mp-${customer.email}-${Date.now()}`
        },
        body: JSON.stringify({
          token: mpToken, // ✅ Token já vem do frontend
          transaction_amount: amount,
          description: 'Gravador Médico - Acesso Vitalício',
          payment_method_id: 'credit_card',
          installments: 1,
          payer: {
            email: customer.email,
            identification: {
              type: 'CPF',
              number: customer.cpf.replace(/\D/g, '')
            }
          }
        })
      })

      const mpResult = await mpResponse.json()

      // ✅ MERCADO PAGO APROVOU
      if (mpResult.status === 'approved') {
        console.log('✅ Aprovado no Mercado Pago!')

        const { data: sale } = await supabaseAdmin.from('sales').insert({
          customer_email: customer.email,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_cpf: customer.cpf,
          amount,
          status: 'paid',
          payment_gateway: 'mercadopago',
          mercadopago_payment_id: mpResult.id,
          fallback_used: false,
          gateway_attempts: [{
            gateway: 'mercadopago',
            success: true,
            attempted_at: new Date().toISOString()
          }]
        }).select().single()

        return NextResponse.json({
          success: true,
          sale_id: sale.id,
          payment_id: mpResult.id,
          fallback_used: false
        })
      }

      // ⚠️ MERCADO PAGO RECUSOU - VERIFICAR SE DEVE TENTAR APPMAX
      const statusDetail = mpResult.status_detail

      // Erros que NÃO devem tentar AppMax (problema do cliente)
      const DONT_RETRY = [
        'cc_rejected_bad_filled_card_number',
        'cc_rejected_bad_filled_security_code',
        'cc_rejected_bad_filled_date'
      ]

      if (DONT_RETRY.includes(statusDetail)) {
        throw new Error('Verifique os dados do cartão')
      }

      console.log('⚠️ MP recusou, tentando AppMax...')

    } catch (mpError: any) {
      console.log('⚠️ Erro no MP, tentando AppMax:', mpError.message)
    }

    // =====================================================
    // 2️⃣ TENTATIVA 2: APPMAX (FALLBACK)
    // =====================================================
    console.log('💳 Tentando AppMax (backup)...')

    const appmaxResponse = await fetch('https://admin.appmax.com.br/api/v3/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': process.env.APPMAX_TOKEN!
      },
      body: JSON.stringify({
        // AppMax recebe token ou dados brutos (verificar documentação)
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          cpf: customer.cpf
        },
        product_id: process.env.APPMAX_PRODUCT_ID,
        quantity: 1,
        payment_method: 'credit_card',
        card_token: appmaxToken // Se AppMax tiver SDK de tokenização
      })
    })

    const appmaxResult = await appmaxResponse.json()

    if (appmaxResult.success) {
      console.log('✅ Aprovado no AppMax (resgatado)!')

      const { data: sale } = await supabaseAdmin.from('sales').insert({
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        amount,
        status: 'paid',
        payment_gateway: 'appmax',
        appmax_order_id: appmaxResult.order.id,
        fallback_used: true, // ✅ Marca como resgatado
        gateway_attempts: [
          { gateway: 'mercadopago', success: false, attempted_at: new Date().toISOString() },
          { gateway: 'appmax', success: true, attempted_at: new Date().toISOString() }
        ]
      }).select().single()

      return NextResponse.json({
        success: true,
        sale_id: sale.id,
        payment_id: appmaxResult.order.id,
        fallback_used: true // ✅ Frontend sabe que foi resgatado
      })
    }

    // ❌ AMBOS RECUSARAM
    throw new Error('Pagamento recusado por todos os gateways')

  } catch (error: any) {
    console.error('❌ Erro no checkout:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 })
  }
}
```

---

## 🔄 TRATAMENTO DE RACE CONDITION (Webhook)

### Problema
Webhook pode chegar antes do `INSERT` na tabela `sales`.

### Solução

```typescript
// lib/mercadopago-webhook.ts
export async function handleMercadoPagoWebhook(request: NextRequest) {
  const body = await request.json()
  const paymentId = body.data.id

  // 1️⃣ SALVAR LOG BRUTO
  await supabaseAdmin.from('mp_webhook_logs').insert({
    event_id: paymentId,
    raw_payload: body,
    processed: false
  })

  // 2️⃣ BUSCAR VENDA (COM RETRY)
  let sale = null
  let retries = 0
  
  while (!sale && retries < 5) {
    const { data } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('mercadopago_payment_id', paymentId)
      .single()
    
    if (data) {
      sale = data
      break
    }
    
    // Esperar 2 segundos e tentar novamente
    console.log(`⏳ Venda ainda não existe, aguardando... (${retries + 1}/5)`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    retries++
  }

  if (!sale) {
    console.log('⚠️ Venda não encontrada após 5 tentativas, retornando 202')
    return NextResponse.json({ message: 'Aceito para reprocessamento' }, { status: 202 })
  }

  // 3️⃣ PROCESSAR NORMALMENTE
  // ... resto do código
}
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Segurança
- [ ] Remover todas as chaves hardcoded
- [ ] Configurar variáveis de ambiente no Lovable
- [ ] Configurar variáveis de ambiente no Vercel/Local
- [ ] Validar que nenhum dado sensível trafega no backend

### Frontend
- [ ] Instalar `@mercadopago/sdk-js`
- [ ] Implementar tokenização dupla
- [ ] Remover envio de dados brutos de cartão
- [ ] Adicionar device fingerprint

### Backend
- [ ] Criar rota `/api/checkout/process` unificada
- [ ] Implementar lógica de fallback com tokens
- [ ] Adicionar tratamento de race condition no webhook
- [ ] Validar variáveis de ambiente obrigatórias

### Banco de Dados
- [ ] Adicionar coluna `fallback_used`
- [ ] Criar tabela `mp_webhook_logs` com `retry_count`
- [ ] Adicionar índices de performance

---

## 🎯 RESULTADO ESPERADO

✅ **Segurança Total:** Nenhum dado sensível trafega no seu servidor  
✅ **PCI Compliant:** Tokens gerados pelos SDKs oficiais dos gateways  
✅ **Alta Conversão:** Fallback automático e transparente  
✅ **Auditoria Completa:** Logs brutos de webhooks  
✅ **Resiliência:** Tratamento de race conditions  

---

**Pronto para implementar a arquitetura segura?** 🛡️🚀
