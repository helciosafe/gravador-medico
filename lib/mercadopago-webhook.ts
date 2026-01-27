import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import { getPaymentStatus } from './mercadopago'
import { createLovableUser, generateSecurePassword } from '@/services/lovable-integration'

/**
 * 🔔 WEBHOOK MERCADO PAGO - COM RACE CONDITION FIX
 * 
 * Trata notificações de pagamento com:
 * - Salvamento de payload bruto para auditoria
 * - Retry com delay se venda ainda não existir (race condition)
 * - Enriquecimento de dados (busca detalhes completos na API MP)
 * - Criação de usuário no Lovable quando aprovado
 */

export async function handleMercadoPagoWebhook(request: NextRequest) {
  console.log('📨 Webhook Mercado Pago recebido')
  
  const body = await request.json()
  
  // 1️⃣ SALVAR PAYLOAD BRUTO (SEMPRE, ANTES DE QUALQUER COISA)
  const { data: logEntry, error: logError } = await supabaseAdmin
    .from('mp_webhook_logs')
    .insert({
      topic: body.action || body.type,
      event_id: body.data?.id,
      raw_payload: body,
      processed: false,
      retry_count: 0
    })
    .select()
    .single()

  if (logError) {
    console.error('❌ Erro ao salvar log de webhook:', logError)
    // Continua mesmo se falhar o log
  }

  // Mercado Pago envia: { action: "payment.updated", data: { id: "12345" } }
  const { action, data } = body
  
  if (action && action.includes('payment')) {
    const paymentId = data.id
    
    try {
      console.log(`🔍 Consultando pagamento: ${paymentId}`)
      
      // 2️⃣ BUSCAR DETALHES COMPLETOS (ENRIQUECIMENTO)
      const payment = await getPaymentStatus(paymentId)
      
      console.log(`📊 Status: ${payment.status}`)
      
      // 3️⃣ TRATAMENTO DE RACE CONDITION
      // Webhook pode chegar antes do INSERT na tabela sales
      let sale = null
      let retries = 0
      const MAX_RETRIES = 5
      const RETRY_DELAY_MS = 2000
      
      while (!sale && retries < MAX_RETRIES) {
        const { data: saleData, error: saleError } = await supabaseAdmin
          .from('sales')
          .select('*')
          .eq('mercadopago_payment_id', paymentId)
          .single()
        
        if (saleData) {
          sale = saleData
          console.log('✅ Venda encontrada no banco')
          break
        }
        
        if (saleError && saleError.code !== 'PGRST116') { // PGRST116 = not found
          console.error('❌ Erro ao buscar venda:', saleError)
          throw saleError
        }
        
        // Venda ainda não existe, aguardar e tentar novamente
        retries++
        console.log(`⏳ Venda ainda não existe no banco, aguardando... (tentativa ${retries}/${MAX_RETRIES})`)
        
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
      
      if (!sale) {
        console.warn(`⚠️ Venda não encontrada após ${MAX_RETRIES} tentativas`)
        
        // Atualizar log com erro
        if (logEntry) {
          await supabaseAdmin
            .from('mp_webhook_logs')
            .update({
              processed: false,
              retry_count: MAX_RETRIES,
              last_error: 'Venda não encontrada no banco após múltiplas tentativas'
            })
            .eq('id', logEntry.id)
        }
        
        // Retornar 202 (Accepted) para MP tentar novamente mais tarde
        return {
          status: 202,
          message: 'Aceito para reprocessamento - venda ainda não existe'
        }
      }
      
      // 4️⃣ ATUALIZAR VENDA COM DADOS ENRIQUECIDOS
      const { error: updateError } = await supabaseAdmin
        .from('sales')
        .update({
          status: mapStatus(payment.status),
          payment_details: payment // ENRIQUECIMENTO
        })
        .eq('id', sale.id)
      
      if (updateError) {
        console.error('❌ Erro ao atualizar venda:', updateError)
        throw updateError
      }
      
      console.log('✅ Venda atualizada com sucesso')
      
      // 5️⃣ SE APROVADO, CRIAR USUÁRIO NO LOVABLE
      if (payment.status === 'approved' && sale) {
        console.log('✅ Pagamento aprovado! Criando usuário no Lovable...')
        
        const password = generateSecurePassword()
        
        const userResult = await createLovableUser({
          email: sale.customer_email,
          password: password,
          full_name: sale.customer_name
        })
        
        if (userResult.success) {
          console.log('✅ Usuário criado no Lovable!')
          
          // TODO: Enviar email com credenciais
          // await sendWelcomeEmail(sale.customer_email, password)
        } else {
          console.error('❌ Erro ao criar usuário no Lovable:', userResult.error)
        }
      }
      
      // 6️⃣ MARCAR LOG COMO PROCESSADO
      if (logEntry) {
        await supabaseAdmin
          .from('mp_webhook_logs')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            retry_count: retries
          })
          .eq('id', logEntry.id)
      }
      
      return payment
      
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error)
      
      // Marcar log com erro
      if (logEntry) {
        await supabaseAdmin
          .from('mp_webhook_logs')
          .update({
            processed: false,
            last_error: error.message,
            retry_count: (logEntry.retry_count || 0) + 1
          })
          .eq('id', logEntry.id)
      }
      
      throw error
    }
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
