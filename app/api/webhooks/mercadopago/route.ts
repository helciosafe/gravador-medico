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
