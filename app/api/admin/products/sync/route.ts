import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Tipagem do item que vem da Appmax dentro do JSONB
interface AppmaxItem {
  id?: string | number
  product_id?: string | number
  title?: string
  name?: string
  unit_price?: number | string
  price?: number | string
  quantity?: number
  image_url?: string
}

interface ProductPerformance {
  total_sales: number
  total_revenue: number
  refund_rate: number
  conversion_rate: number
  health_score: number
  unique_customers: number
  last_sale_at: string
}

interface Product {
  id: string
  name: string
  price: number
  is_active: boolean
  category: string
  performance?: ProductPerformance
}

/**
 * POST: Auto-Discovery de Produtos
 * 
 * Varre a tabela sales_items, extrai produtos únicos
 * e popula a tabela `products` automaticamente (Upsert).
 * 
 * Evita cadastro manual e garante que todos os produtos vendidos estejam catalogados.
 */
export async function POST(request: Request) {
  try {
    const supabase = supabaseAdmin

    // 1️⃣ Executar a função SQL de auto-discovery
    // Esta função varre sales_items e faz o upsert automaticamente
    const { data, error } = await supabase.rpc('discover_products_from_sales')

    if (error) {
      console.error('❌ Erro ao descobrir produtos:', error)
      return NextResponse.json(
        { 
          error: 'Falha ao sincronizar produtos',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // 2️⃣ Retornar resultado
    const result = Array.isArray(data) && data.length > 0 ? data[0] : { discovered_count: 0, products_created: [] }

    return NextResponse.json({
      success: true,
      message: `${result.discovered_count} produtos sincronizados com sucesso`,
      discovered_count: result.discovered_count,
      products: result.products_created,
      synced_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro crítico na sincronização:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Buscar produtos com métricas de performance
 */
export async function GET(request: Request) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const category = searchParams.get('category')

    // 1️⃣ Buscar produtos com join na view de performance
    let query = supabase
      .from('products')
      .select(`
        *,
        performance:product_performance!inner(
          total_sales,
          total_revenue,
          refund_rate,
          conversion_rate,
          health_score,
          unique_customers,
          last_sale_at
        )
      `)
      .order('created_at', { ascending: false })

    // Filtros
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar produtos', details: error.message },
        { status: 500 }
      )
    }

    // 2️⃣ Calcular estatísticas globais
    const typedProducts = (products || []) as Product[]
    
    const stats = {
      total_products: typedProducts.length,
      active_products: typedProducts.filter((p: Product) => p.is_active).length,
      total_revenue: typedProducts.reduce((sum: number, p: Product) => sum + (p.performance?.total_revenue || 0), 0),
      avg_health_score: typedProducts.length 
        ? Math.round(typedProducts.reduce((sum: number, p: Product) => sum + (p.performance?.health_score || 0), 0) / typedProducts.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      products: typedProducts,
      stats
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno', message: error.message },
      { status: 500 }
    )
  }
}
