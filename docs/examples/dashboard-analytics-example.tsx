/**
 * =============================================
 * EXEMPLO: Dashboard Analytics Completo
 * =============================================
 * Exemplo prático de como usar as queries refatoradas
 * em uma página de dashboard Next.js 14+
 * =============================================
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  fetchDashboardMetrics, 
  fetchSalesBySource, 
  fetchTopProducts,
  fetchConversionFunnel 
} from '@/lib/dashboard-queries'
import type {
  AnalyticsHealth,
  MarketingAttribution,
  ProductPerformance,
  AnalyticsFunnel
} from '@/lib/types/analytics'
import BigNumbers from '@/components/dashboard/BigNumbers'
import { RealtimeVisitors } from '@/components/dashboard/RealtimeVisitors'

export default function DashboardAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsHealth | null>(null)
  const [sources, setSources] = useState<MarketingAttribution[]>([])
  const [products, setProducts] = useState<ProductPerformance[]>([])
  const [funnel, setFunnel] = useState<AnalyticsFunnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        // Buscar tudo em paralelo para máxima performance
        const [metricsRes, sourcesRes, productsRes, funnelRes] = await Promise.all([
          fetchDashboardMetrics(supabase),
          fetchSalesBySource(supabase, 10),
          fetchTopProducts(supabase, 5),
          fetchConversionFunnel(supabase)
        ])

        setMetrics(metricsRes.data)
        setSources(sourcesRes.data)
        setProducts(productsRes.data)
        setFunnel(funnelRes.data)
      } catch (err) {
        console.error('❌ Erro ao carregar dashboard:', err)
        setError('Erro ao carregar dados. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()

    // Atualizar a cada 60 segundos
    const interval = setInterval(loadDashboard, 60000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard Analytics</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          Atualizar
        </button>
      </div>

      {/* Big Numbers */}
      {metrics && (
        <BigNumbers 
          metrics={{
            revenue: metrics.revenue,
            sales: metrics.sales,
            conversion_rate: metrics.conversion_rate,
            average_order_value: metrics.average_order_value,
            revenue_change: metrics.revenue_change,
            aov_change: metrics.aov_change,
            visitors_change: metrics.visitors_change,
            time_change: metrics.time_change
          }}
          loading={loading}
        />
      )}

      {/* Visitantes Online */}
      <RealtimeVisitors />

      {/* Funil de Conversão */}
      {funnel && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Funil de Conversão</h2>
          <div className="space-y-2">
            <FunnelStep 
              label="Visitantes" 
              value={funnel.step_visitors} 
              percentage={100}
            />
            <FunnelStep 
              label="Interessados" 
              value={funnel.step_interested} 
              percentage={(funnel.step_interested / funnel.step_visitors) * 100}
            />
            <FunnelStep 
              label="Checkout Iniciado" 
              value={funnel.step_checkout_started} 
              percentage={(funnel.step_checkout_started / funnel.step_visitors) * 100}
            />
            <FunnelStep 
              label="Compra Concluída" 
              value={funnel.step_purchased} 
              percentage={(funnel.step_purchased / funnel.step_visitors) * 100}
            />
          </div>
        </div>
      )}

      {/* Marketing Attribution */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Atribuição de Marketing</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-400 font-medium">Fonte</th>
                <th className="text-left p-3 text-gray-400 font-medium">Meio</th>
                <th className="text-right p-3 text-gray-400 font-medium">Visitantes</th>
                <th className="text-right p-3 text-gray-400 font-medium">Vendas</th>
                <th className="text-right p-3 text-gray-400 font-medium">Receita</th>
                <th className="text-right p-3 text-gray-400 font-medium">Conv. Rate</th>
                <th className="text-right p-3 text-gray-400 font-medium">AOV</th>
                <th className="text-center p-3 text-gray-400 font-medium">Device</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source, idx) => (
                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="p-3 text-white font-medium">{source.source}</td>
                  <td className="p-3 text-gray-300">{source.medium}</td>
                  <td className="p-3 text-right text-white">{source.visitors}</td>
                  <td className="p-3 text-right text-white">{source.sales_count}</td>
                  <td className="p-3 text-right text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(source.total_revenue)}
                  </td>
                  <td className="p-3 text-right text-green-400">{source.conversion_rate}%</td>
                  <td className="p-3 text-right text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(source.average_order_value)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {source.primary_device}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Produtos */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top Produtos</h2>
        <div className="space-y-3">
          {products.map((product, idx) => (
            <div 
              key={product.product_sku} 
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                  #{idx + 1}
                </div>
                <div>
                  <h3 className="text-white font-medium">{product.product_name}</h3>
                  <p className="text-sm text-gray-400">SKU: {product.product_sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(product.total_revenue)}
                </p>
                <p className="text-sm text-gray-400">
                  {product.total_quantity} unidades · {product.total_orders} pedidos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para o Funil
function FunnelStep({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{value.toLocaleString('pt-BR')}</span>
          <span className="text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-brand-500 h-2 rounded-full transition-all" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
