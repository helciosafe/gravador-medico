'use client'

import { useEffect, useState } from 'react'
import BigNumbers from '@/components/dashboard/BigNumbers'
import ConversionFunnel from '@/components/dashboard/ConversionFunnel'
import OperationalHealth from '@/components/dashboard/OperationalHealth'
import RealtimeFeed from '@/components/dashboard/RealtimeFeed'
import { RealtimeVisitors } from '@/components/dashboard/RealtimeVisitors'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw, Download } from 'lucide-react'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [operationalHealth, setOperationalHealth] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setRefreshing(true)
      setLoading(true)
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Falha ao carregar dashboard')
      }

      const result = await response.json()
      setMetrics(result.metrics || null)
      setChartData(result.chartData || [])
      setFunnelData(result.funnelData || [])
      setOperationalHealth(result.operationalHealth || null)
    } catch (err) {
      console.error('Erro no dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Visão Geral</h1>
          <p className="text-gray-400 mt-1">Acompanhe suas métricas em tempo real</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <RealtimeVisitors />
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl hover:shadow-lg hover:shadow-brand-500/30 transition-all">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <BigNumbers metrics={metrics} loading={loading} />

      {/* Saúde Operacional */}
      <OperationalHealth data={operationalHealth || { 
        recoverableCarts: { count: 0, totalValue: 0, last24h: 0 },
        failedPayments: { count: 0, totalValue: 0, reasons: [] },
        chargebacks: { count: 0, totalValue: 0 }
      }} loading={loading} />

      {/* Layout Grid: Gráfico Principal (66%) + Feed Realtime (33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Receita (30 dias)</h3>
                <p className="text-sm text-gray-400 mt-1">Evolução do faturamento</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="h-full w-full bg-gray-700/30 animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                        color: '#fff'
                      }}
                      formatter={(val: number | undefined) => val ? `R$ ${val.toFixed(2)}` : 'R$ 0,00'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorReceita)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Feed em Tempo Real */}
        <div className="lg:col-span-1">
          <RealtimeFeed autoRefresh={true} refreshInterval={30000} />
        </div>
      </div>

      {/* Funil de Conversão - Temporariamente desabilitado */}
      {/* <ConversionFunnel data={funnelData} loading={loading} /> */}
    </div>
  )
}
