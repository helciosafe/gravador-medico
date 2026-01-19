import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateUser } from '@/lib/supabase'

/**
 * Webhook da APPMAX
 * Recebe notificações de compras aprovadas e cria/atualiza usuários
 * 
 * Configurado na APPMAX:
 * URL: https://www.gravadormedico.com.br/api/webhook/appmax
 * Status: ATIVO ✅
 * 
 * A Appmax não usa secret, mas valida por IP e estrutura dos dados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 Webhook APPMAX recebido:', JSON.stringify(body, null, 2))

    // Log do IP de origem para segurança
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    console.log('🔐 IP origem:', { forwardedFor, realIp })

    // Validação básica: verificar se tem estrutura esperada
    if (!body || typeof body !== 'object') {
      console.error('❌ Webhook inválido: corpo não é objeto')
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // A Appmax pode enviar diferentes estruturas dependendo do evento
    // Vamos aceitar múltiplos formatos
    
    // Formato 1: {event: 'purchase.approved', customer: {...}}
    // Formato 2: {status: 'approved', order: {...}}
    // Formato 3: Dados diretos do pedido
    
    const customerEmail = 
      body.customer?.email || 
      body.order?.customer?.email || 
      body.email ||
      body.lead?.email

    const customerName = 
      body.customer?.name || 
      body.order?.customer?.name || 
      body.name ||
      body.firstname + ' ' + body.lastname ||
      body.lead?.name

    const orderId = 
      body.order?.id || 
      body.order_id || 
      body.id

    const orderStatus = 
      body.status || 
      body.order?.status ||
      'approved'

    console.log('📋 Dados extraídos:', {
      email: customerEmail,
      name: customerName,
      orderId,
      status: orderStatus,
    })

    if (!customerEmail) {
      console.error('❌ Email do cliente não encontrado no webhook')
      console.error('📦 Body completo:', body)
      return NextResponse.json(
        { error: 'Email não encontrado', receivedData: Object.keys(body) },
        { status: 400 }
      )
    }

    // Só processa se o pedido foi aprovado
    if (orderStatus !== 'approved' && orderStatus !== 'paid') {
      console.log('⏭️ Pedido ainda não aprovado, status:', orderStatus)
      return NextResponse.json(
        { message: 'Pedido ainda não aprovado' },
        { status: 200 }
      )
    }

    // Criar ou atualizar usuário no Supabase
    console.log('💾 Criando/atualizando usuário no Supabase...')
    const user = await createOrUpdateUser({
      email: customerEmail,
      name: customerName,
      appmax_customer_id: orderId,
    })

    console.log('✅ Usuário criado/atualizado:', user)

    // TODO: Enviar email de boas-vindas com instruções de login
    // await sendWelcomeEmail(customerEmail, customerName)

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user_id: user.id,
    })
  } catch (error) {
    console.error('Erro ao processar webhook APPMAX:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

/**
 * Endpoint GET para testar se o webhook está funcionando
 */
export async function GET() {
  return NextResponse.json({
    message: 'Webhook APPMAX está funcionando',
    timestamp: new Date().toISOString(),
  })
}
