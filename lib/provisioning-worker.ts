import { supabaseAdmin } from './supabase'
import { createLovableUser, generateSecurePassword } from '@/services/lovable-integration'

/**
 * 🏭 PROVISIONING WORKER
 * 
 * Processa fila de provisionamento (criação de usuários + envio de email)
 * 
 * Features:
 * - ✅ Processa fila provisioning_queue
 * - ✅ Atualiza máquina de estados: paid → provisioning → active
 * - ✅ Retry automático (até 3 tentativas)
 * - ✅ Logs detalhados em integration_logs
 * - ✅ Marca provisioning_failed se esgotar tentativas
 */

interface ProvisioningResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    sale_id: string
    error: string
  }>
}

export async function processProvisioningQueue(): Promise<ProvisioningResult> {
  const startTime = Date.now()
  
  console.log('🏭 [PROVISIONING] Iniciando processamento da fila...')

  const result: ProvisioningResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: []
  }

  try {
    // =====================================================
    // 1️⃣ BUSCAR ITENS PENDENTES NA FILA
    // =====================================================
    
    const { data: queueItems, error: queueError} = await supabaseAdmin
      .from('provisioning_queue')
      .select('*, order:sale_id(*)') // Join com sales
      .in('status', ['pending', 'failed'])
      .lt('retry_count', supabaseAdmin.rpc('max_retries')) // Não pegou ainda o máximo de retries
      .or('next_retry_at.is.null,next_retry_at.lte.now()') // Sem retry agendado ou já passou a hora
      .order('created_at', { ascending: true })
      .limit(10) // Processar no máximo 10 por vez

    if (queueError) {
      console.error('❌ Erro ao buscar fila:', queueError)
      throw queueError
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('ℹ️ Nenhum item na fila para processar')
      return result
    }

    console.log(`📋 Encontrados ${queueItems.length} itens para processar`)

    // =====================================================
    // 2️⃣ PROCESSAR CADA ITEM
    // =====================================================
    
    for (const item of queueItems) {
      const itemStartTime = Date.now()
      
      try {
        console.log(`\n🔄 Processando pedido: ${item.order_id}`)

        // Buscar dados do pedido
        const { data: order, error: orderError } = await supabaseAdmin
          .from('sales')
          .select('*')
          .eq('id', item.order_id)
          .single()

        if (orderError || !order) {
          throw new Error(`Pedido não encontrado: ${item.order_id}`)
        }

        // Validar que pedido está pago
        if (order.order_status !== 'paid') {
          console.log(`⚠️ Pedido não está pago (status: ${order.order_status}), pulando...`)
          continue
        }

        // =====================================================
        // 3️⃣ ATUALIZAR STATUS: paid → provisioning
        // =====================================================
        
        await supabaseAdmin
          .from('sales')
          .update({ order_status: 'provisioning' })
          .eq('id', order.id)

        await supabaseAdmin
          .from('provisioning_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        console.log('📝 Status atualizado: paid → provisioning')

        // =====================================================
        // 4️⃣ CRIAR USUÁRIO NO LOVABLE
        // =====================================================
        
        console.log('👤 Criando usuário no Lovable...')
        
        const password = generateSecurePassword()
        
        const userResult = await createLovableUser({
          email: order.customer_email,
          password: password,
          full_name: order.customer_name
        })

        if (!userResult.success) {
          throw new Error(`Falha ao criar usuário: ${userResult.error}`)
        }

        console.log('✅ Usuário criado no Lovable:', userResult.user?.id)

        // Log de sucesso
        await supabaseAdmin.from('integration_logs').insert({
          order_id: order.id,
          action: 'create_user_lovable',
          status: 'success',
          recipient_email: order.customer_email,
          user_id: userResult.user?.id,
          details: {
            password: password, // ⚠️ Armazenar temporariamente para email
            user: userResult.user
          },
          duration_ms: Date.now() - itemStartTime
        })

        // =====================================================
        // 5️⃣ ENVIAR EMAIL (TODO: Implementar)
        // =====================================================
        
        console.log('📧 Enviando email de boas-vindas...')
        
        // TODO: Implementar envio de email
        // await sendWelcomeEmail({
        //   to: order.customer_email,
        //   name: order.customer_name,
        //   password: password,
        //   loginUrl: 'https://gravadormedico.lovable.app'
        // })

        // =====================================================
        // 6️⃣ FINALIZAR: provisioning → active
        // =====================================================
        
        await supabaseAdmin
          .from('sales')
          .update({ order_status: 'active' })
          .eq('id', order.id)

        await supabaseAdmin
          .from('provisioning_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', item.id)

        console.log(`✅ Pedido ${order.id} ativado com sucesso!`)
        result.processed++

      } catch (itemError: any) {
        console.error(`❌ Erro ao processar item ${item.id}:`, itemError)

        result.failed++
        result.errors.push({
          sale_id: item.sale_id,
          error: itemError.message
        })

        // =====================================================
        // 7️⃣ TRATAMENTO DE ERRO COM RETRY
        // =====================================================
        
        const newRetryCount = (item.retry_count || 0) + 1
        const maxRetries = item.max_retries || 3

        if (newRetryCount >= maxRetries) {
          // Esgotou tentativas - marcar como falha permanente
          console.log(`❌ Esgotadas ${maxRetries} tentativas, marcando como falha permanente`)

          await supabaseAdmin
            .from('sales')
            .update({ order_status: 'provisioning_failed' })
            .eq('id', item.order_id)

          await supabaseAdmin
            .from('provisioning_queue')
            .update({
              status: 'failed',
              retry_count: newRetryCount,
              last_error: itemError.message,
              error_details: {
                message: itemError.message,
                stack: itemError.stack,
                timestamp: new Date().toISOString()
              }
            })
            .eq('id', item.id)

          // Log de erro permanente
          await supabaseAdmin.from('integration_logs').insert({
            order_id: item.order_id,
            action: 'create_user_lovable',
            status: 'error',
            recipient_email: item.order?.customer_email,
            error_message: itemError.message,
            details: {
              retry_count: newRetryCount,
              max_retries: maxRetries,
              permanent_failure: true
            },
            duration_ms: Date.now() - itemStartTime
          })

        } else {
          // Agendar próximo retry (exponential backoff)
          const delayMinutes = Math.pow(2, newRetryCount) * 5 // 5min, 10min, 20min
          const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000)

          console.log(`🔄 Agendando retry ${newRetryCount}/${maxRetries} para ${nextRetryAt.toISOString()}`)

          await supabaseAdmin
            .from('provisioning_queue')
            .update({
              status: 'failed',
              retry_count: newRetryCount,
              last_error: itemError.message,
              next_retry_at: nextRetryAt.toISOString(),
              error_details: {
                message: itemError.message,
                timestamp: new Date().toISOString(),
                retry_count: newRetryCount
              }
            })
            .eq('id', item.id)

          // Voltar status do pedido para paid (para tentar novamente)
          await supabaseAdmin
            .from('sales')
            .update({ order_status: 'paid' })
            .eq('id', item.order_id)

          // Log de erro temporário
          await supabaseAdmin.from('integration_logs').insert({
            order_id: item.order_id,
            action: 'create_user_lovable',
            status: 'error',
            recipient_email: item.order?.customer_email,
            error_message: itemError.message,
            details: {
              retry_count: newRetryCount,
              max_retries: maxRetries,
              next_retry_at: nextRetryAt.toISOString(),
              will_retry: true
            },
            duration_ms: Date.now() - itemStartTime
          })
        }
      }
    }

    // =====================================================
    // 8️⃣ RESUMO DO PROCESSAMENTO
    // =====================================================
    
    const duration = Date.now() - startTime
    
    console.log('\n📊 Resumo do processamento:')
    console.log(`  ✅ Processados: ${result.processed}`)
    console.log(`  ❌ Falhas: ${result.failed}`)
    console.log(`  ⏱️ Tempo: ${duration}ms`)

    if (result.errors.length > 0) {
      console.log('  Erros:')
      result.errors.forEach(err => {
        console.log(`    - Pedido ${err.sale_id}: ${err.error}`)
      })
    }

    return result

  } catch (error: any) {
    console.error('❌ Erro crítico no processamento da fila:', error)
    
    result.success = false
    result.errors.push({
      sale_id: 'system',
      error: error.message
    })

    return result
  }
}

/**
 * Processar um pedido específico manualmente (para retry no admin)
 */
export async function processSpecificOrder(orderId: string): Promise<{
  success: boolean
  message: string
}> {
  console.log(`🔧 [MANUAL] Reprocessando pedido: ${orderId}`)

  try {
    // Verificar se existe na fila
    const { data: queueItem } = await supabaseAdmin
      .from('provisioning_queue')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!queueItem) {
      // Criar entrada na fila
      await supabaseAdmin.from('provisioning_queue').insert({
        order_id: orderId,
        status: 'pending',
        retry_count: 0
      })
    } else {
      // Resetar para pending
      await supabaseAdmin
        .from('provisioning_queue')
        .update({
          status: 'pending',
          next_retry_at: null
        })
        .eq('id', queueItem.id)
    }

    // Processar fila
    const result = await processProvisioningQueue()

    return {
      success: result.processed > 0,
      message: result.processed > 0 
        ? 'Pedido reprocessado com sucesso'
        : 'Erro ao reprocessar pedido'
    }

  } catch (error: any) {
    console.error('❌ Erro ao reprocessar pedido:', error)
    
    return {
      success: false,
      message: error.message
    }
  }
}
