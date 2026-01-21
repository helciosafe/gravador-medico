import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 🔔 WEBHOOK HANDLER - AppMax
 * 
 * Recebe notificações de mudanças de status dos pedidos
 * Baseado na imagem dos webhooks disponíveis
 */

// Mapeamento de eventos AppMax → Status/Motivo no banco
const EVENT_MAPPING: Record<string, { status: string; failure_reason?: string }> = {
  'Pedido aprovado': { status: 'approved' },
  'Pedido autorizado': { status: 'approved' },
  'Boleto Gerado': { status: 'pending' },
  'Pedido pago': { status: 'paid' },
  'Pedido pendente de integracao': { status: 'pending' },
  'Pedido Estornado': { status: 'refunded', failure_reason: 'Estornado' },
  'Upsell pago': { status: 'paid' },
  'Pix Gerado': { status: 'pending' },
  'Pix Expirado': { status: 'expired', failure_reason: 'PIX Expirado' },
  'Pix Pago': { status: 'paid' },
  'Pedido integrado': { status: 'approved' },
  'Pedido com boleto vencido': { status: 'expired', failure_reason: 'Boleto Vencido' },
  'Pedido Autorizado com atraso (60min)': { status: 'approved' },
  'Pedido Chargeback em Tratamento': { status: 'chargeback', failure_reason: 'Chargeback em Análise' },
  'Pedido Chargeback Ganho': { status: 'approved', failure_reason: null as any },
}

interface AppmaxWebhookPayload {
  event: string // Nome do evento (ex: "Pix Expirado")
  order_id?: string // ID do pedido na AppMax
  customer_email?: string
  customer_name?: string
  total_amount?: number
  payment_method?: string
  created_at?: string
  // Adicione outros campos conforme necessário
}

export async function POST(request: NextRequest) {
  try {
    const payload: AppmaxWebhookPayload = await request.json()
    
    console.log('📥 Webhook AppMax recebido:', payload.event)

    // Validar evento
    if (!payload.event) {
      return NextResponse.json(
        { error: 'Evento não especificado' },
        { status: 400 }
      )
    }

    // Buscar mapeamento do evento
    const mapping = EVENT_MAPPING[payload.event]
    if (!mapping) {
      console.warn(`⚠️ Evento não mapeado: ${payload.event}`)
      // Retornar 200 para não ficar reenviando
      return NextResponse.json({ 
        message: 'Evento recebido mas não processado',
        event: payload.event 
      })
    }

    // Se tiver order_id, atualizar venda existente
    if (payload.order_id) {
      const { data: existingSale, error: fetchError } = await supabase
        .from('sales')
        .select('id')
        .eq('order_id', payload.order_id)
        .single()

      if (existingSale) {
        // Atualizar status e motivo
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            status: mapping.status,
            failure_reason: mapping.failure_reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', payload.order_id)

        if (updateError) {
          console.error('❌ Erro ao atualizar venda:', updateError)
          return NextResponse.json(
            { error: 'Erro ao atualizar venda' },
            { status: 500 }
          )
        }

        console.log(`✅ Venda ${payload.order_id} atualizada: ${mapping.status}`)
        
        // Se foi PIX Expirado ou Boleto Vencido, marcar carrinho como abandonado
        if (mapping.failure_reason === 'PIX Expirado' || mapping.failure_reason === 'Boleto Vencido') {
          // Buscar carrinho relacionado
          const { error: cartError } = await supabase
            .from('abandoned_carts')
            .update({ 
              status: 'abandoned',
              updated_at: new Date().toISOString()
            })
            .eq('customer_email', payload.customer_email)
            .eq('status', 'recovered')

          if (!cartError) {
            console.log('🛒 Carrinho marcado como abandonado novamente')
          }
        }

        return NextResponse.json({ 
          success: true,
          message: `Pedido ${payload.order_id} atualizado`,
          status: mapping.status
        })
      }
    }

    // Se não encontrou venda existente mas é um evento de pagamento, criar nova venda
    if (payload.customer_email && ['Pedido pago', 'Pix Pago'].includes(payload.event)) {
      const { error: insertError } = await supabase
        .from('sales')
        .insert({
          order_id: payload.order_id,
          customer_email: payload.customer_email,
          customer_name: payload.customer_name,
          total_amount: payload.total_amount || 0,
          status: mapping.status,
          payment_method: payload.payment_method || (payload.event.includes('Pix') ? 'pix' : 'unknown'),
          created_at: payload.created_at || new Date().toISOString(),
        })

      if (insertError) {
        console.error('❌ Erro ao criar venda:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar venda' },
          { status: 500 }
        )
      }

      console.log(`✅ Nova venda criada: ${payload.order_id}`)
      return NextResponse.json({ 
        success: true,
        message: 'Venda criada com sucesso'
      })
    }

    // Evento processado mas sem ação necessária
    return NextResponse.json({ 
      success: true,
      message: `Evento ${payload.event} processado`,
      action: 'none'
    })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}

// GET para verificação de saúde
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: 'AppMax Webhook Handler',
    events_supported: Object.keys(EVENT_MAPPING)
  })
}
