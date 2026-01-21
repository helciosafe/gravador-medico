import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-server'

interface RealtimeEvent {
  id: string
  type: 'sale' | 'cart_abandoned' | 'payment_failed' | 'visit'
  message: string
  value: number
  timestamp: string
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })
  }

  try {
    // Últimas 24 horas
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Buscar últimas vendas aprovadas (últimas 15)
    const { data: sales } = await supabaseAdmin
      .from('sales')
      .select('id, customer_name, total_amount, created_at, status')
      .in('status', ['paid', 'approved'])
      .gte('created_at', last24h)
      .order('created_at', { ascending: false })
      .limit(15)

    // Buscar carrinhos abandonados recentes (últimas 10)
    const { data: carts } = await supabaseAdmin
      .from('abandoned_carts')
      .select('id, customer_name, customer_email, cart_value, created_at, checkout_step')
      .eq('status', 'abandoned')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar pagamentos falhados recentes (últimas 8)
    const { data: failed } = await supabaseAdmin
      .from('sales')
      .select('id, customer_name, total_amount, created_at, status')
      .in('status', ['canceled', 'cancelado', 'refused', 'failed', 'denied'])
      .gte('created_at', last24h)
      .order('created_at', { ascending: false })
      .limit(8)

    // Buscar visitas recentes (últimas 10)
    const { data: visits } = await supabaseAdmin
      .from('analytics_visits')
      .select('id, session_id, page_path, city, country, created_at')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false })
      .limit(10)

    const events: RealtimeEvent[] = []

    // Adicionar vendas como eventos
    if (sales) {
      sales.forEach((sale) => {
        events.push({
          id: `sale_${sale.id}`,
          type: 'sale',
          message: `💰 ${sale.customer_name || 'Cliente'} realizou uma compra`,
          value: sale.total_amount,
          timestamp: sale.created_at,
        })
      })
    }

    // Adicionar carrinhos abandonados
    if (carts) {
      carts.forEach((cart) => {
        const name = cart.customer_name || cart.customer_email?.split('@')[0] || 'Visitante'
        const step = cart.checkout_step ? ` na etapa "${cart.checkout_step}"` : ''
        events.push({
          id: `cart_${cart.id}`,
          type: 'cart_abandoned',
          message: `🛒 ${name} abandonou carrinho${step}`,
          value: cart.cart_value || 0,
          timestamp: cart.created_at,
        })
      })
    }

    // Adicionar pagamentos falhados
    if (failed) {
      failed.forEach((payment) => {
        events.push({
          id: `failed_${payment.id}`,
          type: 'payment_failed',
          message: `❌ Pagamento de ${payment.customer_name || 'Cliente'} recusado`,
          value: payment.total_amount,
          timestamp: payment.created_at,
        })
      })
    }

    // Adicionar visitas recentes
    if (visits) {
      visits.forEach((visit) => {
        const location = visit.city && visit.country 
          ? `${visit.city}, ${visit.country}` 
          : visit.country || 'Localização desconhecida'
        const page = visit.page_path || '/'
        events.push({
          id: `visit_${visit.id}`,
          type: 'visit',
          message: `👁️ Visitante de ${location} em ${page}`,
          value: 0,
          timestamp: visit.created_at,
        })
      })
    }

    // Ordenar por timestamp (mais recente primeiro)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Retornar apenas os 20 mais recentes
    return NextResponse.json({ 
      events: events.slice(0, 20),
      timestamp: new Date().toISOString(),
      total: events.length
    })

  } catch (error) {
    console.error('Erro ao buscar eventos em tempo real:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar eventos' },
      { status: 500 }
    )
  }
}
