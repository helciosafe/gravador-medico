"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Eye,
  MoreVertical,
  Download,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageTicket: number
  revenueGrowth: number
  ordersGrowth: number
  conversionRate: number
}

interface RecentSale {
  id: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  payment_method: string
  created_at: string
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageTicket: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    conversionRate: 0,
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // 1. Buscar métricas otimizadas da VIEW
      const { data: metricsData, error: metricsError } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .single()

      if (metricsError) {
        console.error('Erro ao buscar métricas:', metricsError)
      } else if (metricsData) {
        // Calcular crescimentos (mock - você pode implementar comparação com período anterior)
        const revenueGrowth = 12.5 // +12.5% vs período anterior
        const ordersGrowth = 8.3 // +8.3% vs período anterior
        const conversionRate = metricsData.pix_conversions 
          ? (metricsData.pix_conversions / (metricsData.total_sales || 1)) * 100 
          : 0

        setMetrics({
          totalRevenue: Number(metricsData.total_revenue) || 0,
          totalOrders: metricsData.total_sales || 0,
          totalCustomers: metricsData.total_sales || 0, // Aproximação
          averageTicket: Number(metricsData.avg_ticket) || 0,
          revenueGrowth,
          ordersGrowth,
          conversionRate,
        })
      }

      // 2. Buscar vendas recentes (últimas 10)
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (salesError) {
        console.error('Erro ao buscar vendas:', salesError)
      } else {
        setRecentSales(sales || [])
      }

      // 3. Buscar dados do gráfico (últimos 7 dias) da VIEW
      const { data: chartData, error: chartError } = await supabase
        .from('sales_last_7_days')
        .select('*')
        .order('sale_date', { ascending: true })

      if (chartError) {
        console.error('Erro ao buscar dados do gráfico:', chartError)
      } else if (chartData) {
        const formattedData = chartData.map((item: any) => ({
          date: format(new Date(item.sale_date), 'dd/MM', { locale: ptBR }),
          receita: Number(item.revenue) || 0,
          vendas: item.sales_count || 0,
        }))
        setSalesChart(formattedData)
      }

      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    prefix = '',
    suffix = ''
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50 hover:shadow-2xl hover:border-brand-500/30 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${
          change >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-black text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', {
          minimumFractionDigits: prefix === 'R$ ' ? 2 : 0,
          maximumFractionDigits: prefix === 'R$ ' ? 2 : 0,
        }) : value}{suffix}
      </p>
    </motion.div>
  )

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }

    const labels = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Recusado',
      refunded: 'Reembolsado',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Visão Geral</h1>
          <p className="text-gray-400 mt-1">Acompanhe suas métricas em tempo real</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Faturamento Total"
          value={metrics.totalRevenue}
          change={metrics.revenueGrowth}
          icon={DollarSign}
          color="from-green-500 to-emerald-600"
          prefix="R$ "
        />
        <MetricCard
          title="Total de Vendas"
          value={metrics.totalOrders}
          change={metrics.ordersGrowth}
          icon={ShoppingCart}
          color="from-blue-500 to-cyan-600"
        />
        <MetricCard
          title="Clientes Únicos"
          value={metrics.totalCustomers}
          change={5.2}
          icon={Users}
          color="from-purple-500 to-pink-600"
        />
        <MetricCard
          title="Ticket Médio"
          value={metrics.averageTicket}
          change={3.1}
          icon={CreditCard}
          color="from-orange-500 to-red-600"
          prefix="R$ "
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Receita (7 dias)</h3>
              <p className="text-sm text-gray-400 mt-1">Últimos 7 dias</p>
            </div>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesChart}>
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
                formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorReceita)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Count Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Vendas (7 dias)</h3>
              <p className="text-sm text-gray-400 mt-1">Número de pedidos</p>
            </div>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesChart}>
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
              />
              <Bar 
                dataKey="vendas" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Vendas Recentes</h3>
              <p className="text-sm text-gray-400 mt-1">Últimas {recentSales.length} transações</p>
            </div>
            <button className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Ver todas →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Método</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-white">{sale.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{sale.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-green-400">
                      R$ {Number(sale.total_amount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-400 capitalize">{sale.payment_method}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors">
                      <Eye className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentSales.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhuma venda ainda</h3>
            <p className="text-gray-400">Aguardando a primeira venda via webhook da Appmax</p>
          </div>
        )}
      </div>
    </div>
  )
}
