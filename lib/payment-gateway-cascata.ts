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
  }

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

    return {
      success: false,
      payment_id: '',
      gateway_used: 'appmax',
      attempts,
      error: 'Pagamento recusado por todos os gateways'
    }

  } catch (appmaxError: any) {
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
