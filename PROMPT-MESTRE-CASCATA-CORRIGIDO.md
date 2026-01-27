# 🎯 PROMPT MESTRE: Cascata de Pagamentos (Versão Corrigida)

**Data:** 26 de Janeiro de 2026  
**Objetivo:** Implementar sistema de cascata inteligente Frontend + Backend com filtro de erro e auditoria completa.

---

## 📋 CONTEXTO

Você é um Arquiteto de Software Sênior trabalhando em um sistema de e-commerce com alta conversão.

**Stack Técnico:**
- Next.js 14+ (App Router)
- TypeScript
- Supabase (Banco de Dados Local)
- Shadcn UI
- Mercado Pago SDK (Frontend)
- AppMax API (Backend)

**Objetivo Estratégico:**
Maximizar aprovação de pagamentos usando cascata inteligente: Mercado Pago (taxas baixas) → AppMax (alta aprovação para perfis de risco).

---

## 🎯 FASE 1: BANCO DE DADOS

### 1.1. Alterações na Tabela `sales`

```sql
-- Já existe, mas adicionar colunas faltantes
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax',
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_attempts JSONB,
ADD COLUMN IF NOT EXISTS payment_details JSONB,
ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false;

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway ON public.sales(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id ON public.sales(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_fallback_used ON public.sales(fallback_used) WHERE fallback_used = true;
```

### 1.2. Nova Tabela: Logs Brutos de Webhook

```sql
-- ✅ CRÍTICO: Auditoria completa de webhooks
CREATE TABLE public.mp_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  event_id TEXT,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mp_webhook_logs_event_id ON mp_webhook_logs(event_id);
CREATE INDEX idx_mp_webhook_logs_created_at ON mp_webhook_logs(created_at DESC);
CREATE INDEX idx_mp_webhook_logs_processed ON mp_webhook_logs(processed) WHERE processed = false;

COMMENT ON TABLE mp_webhook_logs IS 'Log bruto de TODOS os webhooks do Mercado Pago para auditoria e debug';
```

### 1.3. Query de Analytics: Vendas Recuperadas

```sql
-- Vendas que AppMax salvou depois de MP recusar
SELECT 
  customer_email,
  customer_name,
  amount,
  gateway_attempts,
  created_at
FROM sales
WHERE payment_gateway = 'appmax'
  AND gateway_attempts::jsonb @> '[{"gateway": "mercadopago", "success": false}]'
  AND status = 'paid'
ORDER BY created_at DESC;

-- Taxa de resgate
SELECT 
  COUNT(*) FILTER (WHERE fallback_used = true) AS vendas_resgatadas,
  COUNT(*) AS vendas_appmax_total,
  ROUND(COUNT(*) FILTER (WHERE fallback_used = true) * 100.0 / COUNT(*), 2) AS taxa_resgate_percent
FROM sales
WHERE payment_gateway = 'appmax';
```

---

## 🛠️ FASE 2: BACKEND - ROTAS SEPARADAS

### 2.1. Criar `/app/api/checkout/mp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { processPayment } from '@/lib/mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

// Códigos de erro do MP que DEVEM tentar AppMax
const MP_ERRORS_SHOULD_RETRY = [
  'cc_rejected_high_risk',
  'cc_rejected_blacklist',
  'cc_rejected_other_reason',
  'cc_rejected_call_for_authorize',
  'cc_rejected_duplicated_payment',
  'cc_rejected_insufficient_amount' // Pode tentar AppMax, às vezes aprova
]

// Códigos que NÃO devem tentar (erro do cliente)
const MP_ERRORS_DONT_RETRY = [
  'cc_rejected_bad_filled_card_number',
  'cc_rejected_bad_filled_security_code',
  'cc_rejected_bad_filled_date',
  'cc_rejected_bad_filled_other'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('💳 Tentando Mercado Pago...')

    const result = await processPayment({
      customer: body.customer,
      amount: body.amount,
      payment_method: body.payment_method,
      card_data: body.card_data
    })

    // ✅ SUCESSO
    if (result.success) {
      // Salvar no banco
      const { data: sale } = await supabaseAdmin.from('sales').insert({
        customer_email: body.customer.email,
        customer_name: body.customer.name,
        customer_phone: body.customer.phone,
        customer_cpf: body.customer.cpf,
        amount: body.amount,
        status: result.status === 'approved' ? 'paid' : 'pending',
        payment_gateway: 'mercadopago',
        mercadopago_payment_id: result.payment_id,
        payment_details: result,
        gateway_attempts: [{
          gateway: 'mercadopago',
          success: true,
          attempted_at: new Date().toISOString()
        }]
      }).select().single()

      return NextResponse.json({
        success: true,
        payment_id: result.payment_id,
        status: result.status,
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64,
        sale_id: sale?.id
      })
    }

    // ❌ ERRO: Decidir se deve tentar AppMax
    const statusDetail = result.status_detail || ''
    
    // Erro do cliente (dados inválidos) - NÃO tenta AppMax
    if (MP_ERRORS_DONT_RETRY.includes(statusDetail)) {
      return NextResponse.json({
        success: false,
        shouldRetryAppmax: false,
        error: 'Verifique os dados do cartão e tente novamente',
        details: result.error
      }, { status: 400 })
    }

    // Erro de risco/recusa - TENTA AppMax
    if (MP_ERRORS_SHOULD_RETRY.includes(statusDetail) || !result.success) {
      console.log('⚠️ MP recusou, mas pode tentar AppMax:', statusDetail)
      
      return NextResponse.json({
        success: false,
        shouldRetryAppmax: true,
        mpError: statusDetail,
        mpAttempt: {
          gateway: 'mercadopago',
          success: false,
          error: result.error,
          attempted_at: new Date().toISOString()
        }
      })
    }

    // Erro genérico
    return NextResponse.json({
      success: false,
      shouldRetryAppmax: false,
      error: result.error
    }, { status: 500 })

  } catch (error: any) {
    console.error('❌ Erro na rota MP:', error)
    return NextResponse.json({
      success: false,
      shouldRetryAppmax: true, // Em caso de erro de rede, tenta AppMax
      error: error.message
    }, { status: 500 })
  }
}
```

### 2.2. Atualizar `/app/api/checkout/route.ts` (AppMax)

Adicionar suporte para receber tentativa do MP:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const mpAttempt = body.mpAttempt || null // Tentativa anterior do MP

  // ... código existente da AppMax ...

  // Ao salvar no banco:
  const gateway_attempts = mpAttempt 
    ? [mpAttempt, { gateway: 'appmax', success: true, attempted_at: new Date().toISOString() }]
    : [{ gateway: 'appmax', success: true, attempted_at: new Date().toISOString() }]

  await supabaseAdmin.from('sales').insert({
    // ... campos existentes ...
    payment_gateway: 'appmax',
    fallback_used: !!mpAttempt, // true se veio do MP
    gateway_attempts
  })
}
```

---

## 🎨 FASE 3: FRONTEND - CASCATA INTELIGENTE

### 3.1. Instalar SDK do Mercado Pago

```bash
npm install @mercadopago/sdk-react
```

### 3.2. Atualizar Componente de Checkout

```tsx
'use client'

import { useState } from 'react'
import { CardPayment } from '@mercadopago/sdk-react'

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false)
  const [retryingGateway, setRetryingGateway] = useState(false)
  const [cardData, setCardData] = useState(null)

  async function handleSubmit(formData: any) {
    setLoading(true)
    
    // Guardar dados do cartão para possível retry
    setCardData(formData.cardData)

    try {
      // 🔵 TENTATIVA 1: MERCADO PAGO
      console.log('💳 Processando com Mercado Pago...')
      
      const mpResponse = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: formData.customer,
          amount: formData.amount,
          payment_method: formData.payment_method,
          card_data: formData.cardData // SDK MP já tokenizou
        })
      })

      const mpResult = await mpResponse.json()

      // ✅ MERCADO PAGO APROVOU
      if (mpResult.success) {
        console.log('✅ Aprovado no Mercado Pago!')
        window.location.href = `/obrigado?sale_id=${mpResult.sale_id}`
        return
      }

      // 🔄 MERCADO PAGO RECUSOU - TENTAR APPMAX?
      if (mpResult.shouldRetryAppmax) {
        console.log('🔄 Tentando gateway alternativo (AppMax)...')
        setRetryingGateway(true)

        // 🟢 TENTATIVA 2: APPMAX
        const appmaxResponse = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: formData.customer,
            amount: formData.amount,
            paymentMethod: formData.payment_method === 'credit_card' ? 'credit' : 'pix',
            cardData: formData.cardData, // Dados RAW (AppMax não usa token MP)
            mpAttempt: mpResult.mpAttempt // Log da tentativa MP
          })
        })

        const appmaxResult = await appmaxResponse.json()

        // ✅ APPMAX APROVOU
        if (appmaxResult.success) {
          console.log('✅ Aprovado no AppMax (gateway de backup)!')
          window.location.href = `/obrigado?sale_id=${appmaxResult.sale_id}&rescued=true`
          return
        }

        // ❌ AMBOS RECUSARAM
        throw new Error(appmaxResult.error || 'Pagamento recusado por todos os gateways')
      }

      // ❌ ERRO DO CLIENTE (dados inválidos)
      throw new Error(mpResult.error || 'Erro ao processar pagamento')

    } catch (error: any) {
      console.error('❌ Erro no checkout:', error)
      alert(error.message)
    } finally {
      setLoading(false)
      setRetryingGateway(false)
    }
  }

  return (
    <div>
      {/* Formulário de pagamento */}
      
      {loading && (
        <div className="loading-overlay">
          {retryingGateway ? (
            <p>🔄 Processando com gateway alternativo...</p>
          ) : (
            <p>💳 Processando pagamento...</p>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 📨 FASE 4: WEBHOOK - LOGS BRUTOS

### 4.1. Atualizar `lib/mercadopago-webhook.ts`

```typescript
export async function handleMercadoPagoWebhook(request: NextRequest) {
  const body = await request.json()
  
  console.log('📨 Webhook Mercado Pago recebido')

  // 1️⃣ SALVAR PAYLOAD CRU (SEMPRE)
  const { data: logEntry, error: logError } = await supabaseAdmin
    .from('mp_webhook_logs')
    .insert({
      topic: body.action || body.type,
      event_id: body.data?.id,
      raw_payload: body,
      processed: false
    })
    .select()
    .single()

  if (logError) {
    console.error('❌ Erro ao salvar log de webhook:', logError)
  }

  // 2️⃣ PROCESSAR SE FOR NOTIFICAÇÃO DE PAGAMENTO
  if (body.action && body.action.includes('payment')) {
    const paymentId = body.data.id

    try {
      console.log(`🔍 Buscando detalhes do pagamento: ${paymentId}`)
      
      // 3️⃣ BUSCAR DETALHES COMPLETOS (ENRIQUECIMENTO)
      const payment = await getPaymentStatus(paymentId)
      
      console.log(`📊 Status: ${payment.status}`)

      // 4️⃣ ATUALIZAR VENDA
      const { data: sale, error: updateError } = await supabaseAdmin
        .from('sales')
        .update({
          status: mapStatus(payment.status),
          payment_details: payment // ENRIQUECIMENTO
        })
        .eq('mercadopago_payment_id', paymentId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // 5️⃣ SE APROVADO, CRIAR USUÁRIO NO LOVABLE
      if (payment.status === 'approved' && sale) {
        console.log('✅ Pagamento aprovado! Criando usuário...')
        
        const password = generateSecurePassword()
        
        const userResult = await createLovableUser({
          email: sale.customer_email,
          password,
          full_name: sale.customer_name
        })

        if (userResult.success) {
          console.log('✅ Usuário criado no Lovable!')
          // TODO: Enviar email com credenciais
        }
      }

      // 6️⃣ MARCAR LOG COMO PROCESSADO
      await supabaseAdmin
        .from('mp_webhook_logs')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', logEntry.id)

      return payment

    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error)
      
      // Marcar log como erro
      await supabaseAdmin
        .from('mp_webhook_logs')
        .update({ 
          processed: false, 
          error: error.message 
        })
        .eq('id', logEntry.id)
    }
  }

  return null
}
```

---

## 📊 FASE 5: PAINEL ADMIN LOVABLE

### 5.1. Criar `/app/admin/lovable/users/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { listLovableUsers, resetLovablePassword } from '@/services/lovable-integration'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function LovableUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const result = await listLovableUsers()
    if (result.success) {
      setUsers(result.users || [])
    }
    setLoading(false)
  }

  async function handleResetPassword(userId: string, email: string) {
    const confirmed = confirm(`Resetar senha de ${email}?`)
    if (!confirmed) return

    const newPassword = prompt('Digite a nova senha (mínimo 6 caracteres):')
    if (!newPassword || newPassword.length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres')
      return
    }

    const result = await resetLovablePassword({ userId, newPassword })
    
    if (result.success) {
      toast({
        title: '✅ Senha resetada!',
        description: `Nova senha: ${newPassword}`
      })
    } else {
      toast({
        title: '❌ Erro',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Usuários Lovable</h1>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResetPassword(user.id, user.email)}
                >
                  Resetar Senha
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## 📈 FASE 6: DASHBOARD DE MÉTRICAS

### 6.1. Adicionar Widget "Vendas Recuperadas"

```tsx
// app/admin/dashboard/page.tsx

async function getRecoveredSales() {
  const { data } = await supabaseAdmin
    .from('sales')
    .select('*')
    .eq('payment_gateway', 'appmax')
    .eq('fallback_used', true)
    .eq('status', 'paid')

  return data || []
}

export default async function DashboardPage() {
  const recoveredSales = await getRecoveredSales()
  const recoveredRevenue = recoveredSales.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>💰 Vendas Recuperadas pelo AppMax</CardTitle>
          <CardDescription>
            Vendas que o Mercado Pago recusou mas AppMax aprovou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {recoveredSales.length} vendas
          </div>
          <div className="text-xl text-muted-foreground">
            R$ {recoveredRevenue.toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Criar tabela `mp_webhook_logs`
- [ ] Adicionar coluna `fallback_used` em `sales`
- [ ] Criar rota `/api/checkout/mp/route.ts` com filtro de erro
- [ ] Atualizar `/api/checkout/route.ts` para receber `mpAttempt`
- [ ] Atualizar webhook para salvar payload bruto
- [ ] Adicionar lógica de enriquecimento de dados

### Frontend
- [ ] Instalar `@mercadopago/sdk-react`
- [ ] Atualizar componente de checkout com cascata
- [ ] Adicionar estado `retryingGateway`
- [ ] Implementar lógica de retry transparente
- [ ] Adicionar feedback visual "Tentando gateway alternativo..."

### Admin
- [ ] Criar página `/admin/lovable/users`
- [ ] Implementar tabela de usuários (Shadcn Table)
- [ ] Adicionar botão "Resetar Senha"
- [ ] Criar widget "Vendas Recuperadas" no dashboard

### Testes
- [ ] Testar MP aprovado direto
- [ ] Testar MP recusado → AppMax aprovado
- [ ] Testar ambos recusados
- [ ] Testar erro de dados inválidos (não deve tentar AppMax)
- [ ] Validar logs de webhook brutos
- [ ] Confirmar criação de usuário Lovable

---

## 🚀 ORDEM DE EXECUÇÃO

1. **FASE 1:** Execute SQL (10 minutos)
2. **FASE 2:** Crie rotas de backend (1 hora)
3. **FASE 4:** Atualize webhook com logs brutos (30 minutos)
4. **FASE 3:** Refatore frontend (2 horas)
5. **FASE 5:** Crie painel admin Lovable (1 hora)
6. **FASE 6:** Adicione métricas (30 minutos)

**Total:** ~5 horas de implementação

---

**Pronto para começar?** 🚀
