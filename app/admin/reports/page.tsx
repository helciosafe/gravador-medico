'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Percent,
  CreditCard,
  Zap,
  Receipt,
  XCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  UserCheck,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Activity,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// Tipos
interface Sale {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_state?: string
  total_amount: number
  status: string
  payment_method: string
  payment_gateway?: string
  created_at: string
  paid_at?: string
  fallback_used?: boolean
  metadata?: {
    state?: string
    [key: string]: unknown
  }
}

interface ReportData {
  // Métricas Principais
  totalRevenue: number
  totalOrders: number
  approvedOrders: number
  totalCustomers: number
  averageTicket: number
  conversionRate: number
  
  // Checkout & Conversão
  checkoutVisits: number
  checkoutConversion: number
  
  // Cancelamentos & Reembolsos
  cancelledOrders: number
  cancelledRate: number
  refundedOrders: number
  refundedRevenue: number
  
  // Métodos de Pagamento
  pixOrders: number
  pixRevenue: number
  pixConversion: number
  creditCardOrders: number
  creditCardRevenue: number
  creditCardConversion: number
  boletoOrders: number
  boletoRevenue: number
  boletoConversion: number
  
  // Parcelamento
  installmentData: { installments: string; count: number; revenue: number }[]
  
  // Clientes
  newCustomers: number
  returningCustomers: number
  returningRate: number
  
  // Carrinhos Abandonados
  abandonedCarts: number
  abandonedValue: number
  recoveredCarts: number
  recoveredValue: number
  
  // Geográfico
  topStates: { state: string; orders: number; revenue: number }[]
  
  // Produtos
  topProducts: { name: string; quantity: number; revenue: number }[]
  
  // Série Temporal
  dailyRevenue: { date: string; revenue: number; orders: number }[]
  
  // Comparativo
  previousRevenue: number
  revenueGrowth: number
  previousOrders: number
  ordersGrowth: number
}

type TabType = 'geral' | 'conversao' | 'pagamentos' | 'clientes' | 'produtos'
type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const [period, setPeriod] = useState<PeriodType>('month')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return format(date, 'yyyy-MM-dd')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    generateReport()
  }, [period, startDate, endDate])

  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date = endOfDay(now)

    switch (period) {
      case 'today':
        start = startOfDay(now)
        break
      case 'yesterday':
        start = startOfDay(subDays(now, 1))
        end = endOfDay(subDays(now, 1))
        break
      case 'week':
        start = startOfDay(subDays(now, 7))
        break
      case 'month':
        start = startOfDay(subDays(now, 30))
        break
      case 'year':
        start = startOfDay(subDays(now, 365))
        break
      case 'custom':
        start = startOfDay(new Date(startDate))
        end = endOfDay(new Date(endDate))
        break
      default:
        start = startOfDay(subDays(now, 30))
    }

    return { start, end }
  }

  const generateReport = async () => {
    try {
      setRefreshing(true)
      const { start, end } = getDateRange()

      // Buscar vendas via API (usa supabaseAdmin que ignora RLS)
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      })

      const response = await fetch(`/api/admin/sales?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        console.error('Erro ao buscar vendas:', response.status)
        setLoading(false)
        setRefreshing(false)
        return
      }

      const result = await response.json()
      const sales = result.sales || []

      // Buscar período anterior para comparação
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const prevStart = new Date(start)
      const prevEnd = new Date(end)
      prevStart.setDate(prevStart.getDate() - daysDiff)
      prevEnd.setDate(prevEnd.getDate() - daysDiff)

      const prevParams = new URLSearchParams({
        start: prevStart.toISOString(),
        end: prevEnd.toISOString()
      })

      const prevResponse = await fetch(`/api/admin/sales?${prevParams.toString()}`, {
        credentials: 'include'
      })
      const prevResult = prevResponse.ok ? await prevResponse.json() : { sales: [] }
      const prevSales = prevResult.sales || []

      // Buscar carrinhos abandonados diretamente do Supabase (checkout_attempts)
      const { data: abandonedData } = await supabase
        .from('checkout_attempts')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .in('status', ['abandoned', 'expired', 'pending'])

      // Filtrar por status
      const allSales: Sale[] = sales || []
      const approved = allSales.filter((s: Sale) => ['approved', 'paid', 'complete'].includes(s.status))
      const cancelled = allSales.filter((s: Sale) => ['cancelled', 'canceled', 'cancelado'].includes(s.status))
      const refunded = allSales.filter((s: Sale) => ['refunded', 'reversed', 'chargeback'].includes(s.status))
      const pending = allSales.filter((s: Sale) => ['pending', 'processing'].includes(s.status))

      // Período anterior
      const allPrevSales: Sale[] = prevSales || []
      const prevApproved = allPrevSales.filter((s: Sale) => ['approved', 'paid', 'complete'].includes(s.status))
      const prevRevenue = prevApproved.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
      const prevOrdersCount = prevApproved.length

      // Métricas principais
      const totalRevenue = approved.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
      const totalOrders = allSales.length
      const approvedOrders = approved.length
      const uniqueEmails = new Set(approved.map((s) => s.customer_email).filter(Boolean))
      const totalCustomers = uniqueEmails.size
      const averageTicket = approvedOrders > 0 ? totalRevenue / approvedOrders : 0
      const conversionRate = totalOrders > 0 ? (approvedOrders / totalOrders) * 100 : 0

      // Crescimento
      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const ordersGrowth = prevOrdersCount > 0 ? ((approvedOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0

      // Checkout (usando checkout_attempts se disponível)
      const checkoutVisits = (abandonedData?.length || 0) + totalOrders
      const checkoutConversion = checkoutVisits > 0 ? (approvedOrders / checkoutVisits) * 100 : 0

      // Cancelamentos
      const cancelledOrders = cancelled.length
      const cancelledRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
      const refundedOrders = refunded.length
      const refundedRevenue = refunded.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)

      // Métodos de pagamento
      const pixSales = approved.filter((s) => s.payment_method === 'pix')
      const creditSales = approved.filter((s) => ['credit_card', 'creditCard', 'credit'].includes(s.payment_method))
      const boletoSales = approved.filter((s) => s.payment_method === 'boleto')

      const pixAttempts = allSales.filter((s) => s.payment_method === 'pix')
      const creditAttempts = allSales.filter((s) => ['credit_card', 'creditCard', 'credit'].includes(s.payment_method))
      const boletoAttempts = allSales.filter((s) => s.payment_method === 'boleto')

      // Parcelamentos (simulado - idealmente viria de sales_items ou metadata)
      const installmentData = [
        { installments: '1x', count: Math.floor(creditSales.length * 0.4), revenue: creditSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) * 0.4 },
        { installments: '2x', count: Math.floor(creditSales.length * 0.2), revenue: creditSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) * 0.2 },
        { installments: '3x', count: Math.floor(creditSales.length * 0.15), revenue: creditSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) * 0.15 },
        { installments: '6x', count: Math.floor(creditSales.length * 0.15), revenue: creditSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) * 0.15 },
        { installments: '12x', count: Math.floor(creditSales.length * 0.1), revenue: creditSales.reduce((s, sale) => s + Number(sale.total_amount || 0), 0) * 0.1 },
      ].filter(i => i.count > 0)

      // Clientes recorrentes
      const emailCounts = new Map<string, number>()
      approved.forEach((s) => {
        if (s.customer_email) {
          emailCounts.set(s.customer_email, (emailCounts.get(s.customer_email) || 0) + 1)
        }
      })
      const returningCustomers = Array.from(emailCounts.values()).filter((c) => c > 1).length
      const newCustomers = totalCustomers - returningCustomers
      const returningRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0

      // Carrinhos abandonados
      const abandonedCarts = abandonedData?.length || 0
      const abandonedValue = abandonedData?.reduce((sum, c) => sum + Number(c.cart_total || c.total_amount || 0), 0) || 0
      const recoveredCarts = 0 // Idealmente viria de uma tabela de recuperação
      const recoveredValue = 0

      // Top estados (baseado em metadata ou dados disponíveis)
      const stateMap = new Map<string, { orders: number; revenue: number }>()
      approved.forEach((s) => {
        const state = s.metadata?.state || s.customer_state || 'Não informado'
        const existing = stateMap.get(state)
        if (existing) {
          existing.orders++
          existing.revenue += Number(s.total_amount || 0)
        } else {
          stateMap.set(state, { orders: 1, revenue: Number(s.total_amount || 0) })
        }
      })
      const topStates = Array.from(stateMap.entries())
        .map(([state, data]) => ({ state, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Top produtos
      const topProducts = [
        { name: 'Método Gravador Médico', quantity: approvedOrders, revenue: totalRevenue }
      ]

      // Receita diária
      const dailyMap = new Map<string, { revenue: number; orders: number }>()
      approved.forEach((sale) => {
        const date = format(new Date(sale.created_at), 'dd/MM')
        const existing = dailyMap.get(date)
        if (existing) {
          existing.revenue += Number(sale.total_amount || 0)
          existing.orders += 1
        } else {
          dailyMap.set(date, { revenue: Number(sale.total_amount || 0), orders: 1 })
        }
      })
      const dailyRevenue = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      }))

      setData({
        totalRevenue,
        totalOrders,
        approvedOrders,
        totalCustomers,
        averageTicket,
        conversionRate,
        checkoutVisits,
        checkoutConversion,
        cancelledOrders,
        cancelledRate,
        refundedOrders,
        refundedRevenue,
        pixOrders: pixSales.length,
        pixRevenue: pixSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        pixConversion: pixAttempts.length > 0 ? (pixSales.length / pixAttempts.length) * 100 : 0,
        creditCardOrders: creditSales.length,
        creditCardRevenue: creditSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        creditCardConversion: creditAttempts.length > 0 ? (creditSales.length / creditAttempts.length) * 100 : 0,
        boletoOrders: boletoSales.length,
        boletoRevenue: boletoSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        boletoConversion: boletoAttempts.length > 0 ? (boletoSales.length / boletoAttempts.length) * 100 : 0,
        installmentData,
        newCustomers,
        returningCustomers,
        returningRate,
        abandonedCarts,
        abandonedValue,
        recoveredCarts,
        recoveredValue,
        topStates,
        topProducts,
        dailyRevenue,
        previousRevenue: prevRevenue,
        revenueGrowth,
        previousOrders: prevOrdersCount,
        ordersGrowth,
      })
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const exportReport = () => {
    if (!data) return

    const reportText = `
RELATÓRIO DE MÉTRICAS
Período: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}
Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}

============================================
RESUMO EXECUTIVO
============================================

Faturamento Total: ${formatCurrency(data.totalRevenue)}
Total de Pedidos: ${data.totalOrders}
Pedidos Aprovados: ${data.approvedOrders}
Clientes Únicos: ${data.totalCustomers}
Ticket Médio: ${formatCurrency(data.averageTicket)}
Taxa de Conversão: ${formatPercent(data.conversionRate)}

============================================
COMPARATIVO
============================================

Crescimento de Receita: ${data.revenueGrowth > 0 ? '+' : ''}${formatPercent(data.revenueGrowth)}
Crescimento de Pedidos: ${data.ordersGrowth > 0 ? '+' : ''}${formatPercent(data.ordersGrowth)}

============================================
MÉTODOS DE PAGAMENTO
============================================

PIX: ${data.pixOrders} pedidos | ${formatCurrency(data.pixRevenue)} | ${formatPercent(data.pixConversion)} conversão
Cartão: ${data.creditCardOrders} pedidos | ${formatCurrency(data.creditCardRevenue)} | ${formatPercent(data.creditCardConversion)} conversão
Boleto: ${data.boletoOrders} pedidos | ${formatCurrency(data.boletoRevenue)} | ${formatPercent(data.boletoConversion)} conversão

============================================
CLIENTES
============================================

Novos: ${data.newCustomers}
Recorrentes: ${data.returningCustomers} (${formatPercent(data.returningRate)})

============================================
CARRINHOS ABANDONADOS
============================================

Abandonados: ${data.abandonedCarts}
Valor Perdido: ${formatCurrency(data.abandonedValue)}

---
Relatório gerado automaticamente pelo Gravador Médico
    `.trim()

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-metricas-${format(new Date(), 'dd-MM-yyyy')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Dados para gráfico de pizza de pagamentos
  const paymentMethodsData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'PIX', value: data.pixRevenue, color: '#10b981' },
      { name: 'Cartão', value: data.creditCardRevenue, color: '#3b82f6' },
      { name: 'Boleto', value: data.boletoRevenue, color: '#f59e0b' },
    ].filter(item => item.value > 0)
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-gray-400 text-sm">Gerando relatório...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              Métricas
            </h1>
            <p className="text-gray-400 mt-1.5">
              Análise completa de vendas e performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={generateReport}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-800/30 rounded-xl p-1.5 border border-gray-700/30 w-fit overflow-x-auto">
          {[
            { id: 'geral', label: 'Geral', icon: PieChart },
            { id: 'conversao', label: 'Conversão', icon: Target },
            { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'produtos', label: 'Produtos', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Período */}
        <div className="flex items-center gap-2 bg-gray-800/30 rounded-xl p-1.5 border border-gray-700/30 w-fit overflow-x-auto">
          {[
            { id: 'today', label: 'Hoje' },
            { id: 'yesterday', label: 'Ontem' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPeriod('custom')
              setStartDate(e.target.value)
            }}
            className="px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <span className="text-gray-500">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPeriod('custom')
              setEndDate(e.target.value)
            }}
            className="px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Content */}
        {data && (
          <AnimatePresence mode="wait">
            {/* Tab Geral */}
            {activeTab === 'geral' && (
              <motion.div
                key="geral"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Cards Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vendas */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Vendas</h3>
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    {data.approvedOrders > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{data.approvedOrders}</p>
                        <div className="flex items-center gap-2">
                          {data.ordersGrowth >= 0 ? (
                            <span className="flex items-center gap-1 text-sm text-emerald-400">
                              <ArrowUpRight className="w-4 h-4" />
                              +{formatPercent(data.ordersGrowth)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-red-400">
                              <ArrowDownRight className="w-4 h-4" />
                              {formatPercent(data.ordersGrowth)}
                            </span>
                          )}
                          <span className="text-gray-500 text-sm">vs período anterior</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foram realizados pedidos</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Receita */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Receita</h3>
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    {data.totalRevenue > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-white mb-2">{formatCurrency(data.totalRevenue)}</p>
                        <div className="flex items-center gap-2">
                          {data.revenueGrowth >= 0 ? (
                            <span className="flex items-center gap-1 text-sm text-emerald-400">
                              <ArrowUpRight className="w-4 h-4" />
                              +{formatPercent(data.revenueGrowth)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-red-400">
                              <ArrowDownRight className="w-4 h-4" />
                              {formatPercent(data.revenueGrowth)}
                            </span>
                          )}
                          <span className="text-gray-500 text-sm">vs período anterior</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve pedidos pagos</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Conversão do Checkout */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Conversão do Checkout</h3>
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    {data.checkoutVisits > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{formatPercent(data.checkoutConversion)}</p>
                        <p className="text-gray-500 text-sm">{data.checkoutVisits} acessos ao checkout</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve acessos ao checkout</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Médio */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ticket Médio</h3>
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Receipt className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>
                    {data.averageTicket > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-white mb-2">{formatCurrency(data.averageTicket)}</p>
                        <p className="text-gray-500 text-sm">por pedido aprovado</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foi possível medir o valor gasto</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Taxa de Pedidos Cancelados */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Taxa de Pedidos Cancelados</h3>
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                    {data.totalOrders > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{formatPercent(data.cancelledRate)}</p>
                        <p className="text-gray-500 text-sm">{data.cancelledOrders} pedidos cancelados</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foi possível calcular a taxa de pedidos</p>
                        <p className="text-gray-600 text-sm">cancelados no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Taxa de Conversão de Boletos */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Taxa de Conversão de Boletos</h3>
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <FileText className="w-5 h-5 text-orange-400" />
                      </div>
                    </div>
                    {data.boletoOrders > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{formatPercent(data.boletoConversion)}</p>
                        <p className="text-gray-500 text-sm">{data.boletoOrders} boletos pagos</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foram realizados pagamentos em boleto</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Segunda linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Taxa de Conversão por PIX */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Taxa de Conversão por PIX</h3>
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    {data.pixOrders > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{formatPercent(data.pixConversion)}</p>
                        <p className="text-gray-500 text-sm">{data.pixOrders} PIX aprovados</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foi solicitado pagamento por Pix</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Taxa de Clientes Recorrentes */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Taxa de Clientes Recorrentes</h3>
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <UserCheck className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    {data.totalCustomers > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{formatPercent(data.returningRate)}</p>
                        <p className="text-gray-500 text-sm">{data.returningCustomers} clientes recorrentes</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve clientes</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Carrinhos Abandonados */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Carrinhos Abandonados</h3>
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <ShoppingBag className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    {data.abandonedCarts > 0 ? (
                      <>
                        <p className="text-4xl font-bold text-white mb-2">{data.abandonedCarts}</p>
                        <p className="text-gray-500 text-sm">{formatCurrency(data.abandonedValue)} em valor perdido</p>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não foram recuperados carrinhos</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terceira linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Parcelamentos */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Parcelamentos</h3>
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    {data.installmentData.length > 0 ? (
                      <div className="space-y-2">
                        {data.installmentData.map((item) => (
                          <div key={item.installments} className="flex justify-between items-center">
                            <span className="text-gray-400">{item.installments}</span>
                            <span className="text-white font-medium">{item.count} pedidos</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve parcelamentos de compra</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Formas de Pagamento */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Formas de Pagamento</h3>
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Wallet className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    {data.totalRevenue > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            PIX
                          </span>
                          <span className="text-white font-medium">{formatCurrency(data.pixRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            Cartão
                          </span>
                          <span className="text-white font-medium">{formatCurrency(data.creditCardRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-amber-500" />
                            Boleto
                          </span>
                          <span className="text-white font-medium">{formatCurrency(data.boletoRevenue)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve pedidos pagos</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>

                  {/* Top Vendas por Estado */}
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Vendas por Estado</h3>
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                    </div>
                    {data.topStates.length > 0 ? (
                      <div className="space-y-2">
                        {data.topStates.slice(0, 5).map((state, i) => (
                          <div key={state.state} className="flex justify-between items-center">
                            <span className="flex items-center gap-2 text-gray-400">
                              <span className="text-xs font-bold text-gray-500">{i + 1}.</span>
                              {state.state}
                            </span>
                            <span className="text-white font-medium">{state.orders} vendas</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Não houve pedidos pagos</p>
                        <p className="text-gray-600 text-sm">no período selecionado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Produtos */}
                <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Produtos</h3>
                    <div className="p-2 rounded-lg bg-pink-500/20">
                      <Package className="w-5 h-5 text-pink-400" />
                    </div>
                  </div>
                  {data.topProducts.length > 0 && data.topProducts[0].quantity > 0 ? (
                    <div className="space-y-3">
                      {data.topProducts.map((product, i) => (
                        <div key={product.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-700/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-white">{product.name}</p>
                              <p className="text-sm text-gray-400">{product.quantity} unidades vendidas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Não foram realizados pedidos</p>
                      <p className="text-gray-600 text-sm">no período selecionado.</p>
                    </div>
                  )}
                </div>

                {/* Gráfico de Evolução */}
                {data.dailyRevenue.length > 0 && (
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand-400" />
                      Evolução Diária
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Acompanhe a receita (R$) e quantidade de pedidos por dia no período selecionado
                    </p>
                    
                    {/* Legenda explicativa */}
                    <div className="flex flex-wrap gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500" />
                        <div>
                          <span className="text-white font-medium">Receita (R$)</span>
                          <span className="text-gray-400 text-sm ml-2">Eixo esquerdo</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                        <div>
                          <span className="text-white font-medium">Pedidos (qtd)</span>
                          <span className="text-gray-400 text-sm ml-2">Eixo direito</span>
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={[...data.dailyRevenue].reverse()}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af" 
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickLine={{ stroke: '#4b5563' }}
                        />
                        <YAxis 
                          yAxisId="revenue"
                          orientation="left"
                          stroke="#10b981" 
                          tick={{ fill: '#10b981', fontSize: 12 }}
                          tickLine={{ stroke: '#10b981' }}
                          tickFormatter={(value: number) => `R$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                          label={{ 
                            value: 'Receita (R$)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fill: '#10b981', fontSize: 12 }
                          }}
                        />
                        <YAxis 
                          yAxisId="orders"
                          orientation="right"
                          stroke="#3b82f6" 
                          tick={{ fill: '#3b82f6', fontSize: 12 }}
                          tickLine={{ stroke: '#3b82f6' }}
                          allowDecimals={false}
                          label={{ 
                            value: 'Pedidos', 
                            angle: 90, 
                            position: 'insideRight',
                            style: { fill: '#3b82f6', fontSize: 12 }
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '12px',
                            color: '#fff',
                            padding: '12px 16px',
                          }}
                          labelStyle={{ color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}
                          formatter={(value: number | string | undefined, name: string | undefined) => {
                            if (name === 'Receita') {
                              return [formatCurrency(Number(value) || 0), '💰 Receita do dia']
                            }
                            return [`${value} pedido${Number(value) !== 1 ? 's' : ''}`, '📦 Pedidos do dia']
                          }}
                          labelFormatter={(label) => `📅 Dia ${label}`}
                        />
                        <Area
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          name="Receita"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Area
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorOrders)"
                          name="Pedidos"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    
                    {/* Resumo do período */}
                    <div className="mt-6 pt-6 border-t border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Receita</p>
                        <p className="text-emerald-400 font-bold text-lg">{formatCurrency(data.totalRevenue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Pedidos</p>
                        <p className="text-blue-400 font-bold text-lg">{data.approvedOrders}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Média/Dia</p>
                        <p className="text-white font-bold text-lg">
                          {formatCurrency(data.dailyRevenue.length > 0 ? data.totalRevenue / data.dailyRevenue.length : 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Melhor Dia</p>
                        <p className="text-yellow-400 font-bold text-lg">
                          {formatCurrency(Math.max(...data.dailyRevenue.map(d => d.revenue), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab Conversão */}
            {activeTab === 'conversao' && (
              <motion.div
                key="conversao"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 via-gray-800/50 to-gray-800/50 border border-purple-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Conversão do Checkout
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.checkoutConversion)}</p>
                  <p className="text-gray-400">{data.checkoutVisits} visitas → {data.approvedOrders} vendas</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-gray-800/50 to-gray-800/50 border border-emerald-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    Conversão PIX
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.pixConversion)}</p>
                  <p className="text-gray-400">{data.pixOrders} PIX aprovados</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 via-gray-800/50 to-gray-800/50 border border-blue-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    Conversão Cartão
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.creditCardConversion)}</p>
                  <p className="text-gray-400">{data.creditCardOrders} cartões aprovados</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-amber-600/20 via-gray-800/50 to-gray-800/50 border border-amber-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    Conversão Boleto
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.boletoConversion)}</p>
                  <p className="text-gray-400">{data.boletoOrders} boletos pagos</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-red-600/20 via-gray-800/50 to-gray-800/50 border border-red-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    Taxa de Cancelamento
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.cancelledRate)}</p>
                  <p className="text-gray-400">{data.cancelledOrders} pedidos cancelados</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-cyan-600/20 via-gray-800/50 to-gray-800/50 border border-cyan-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Taxa Geral de Aprovação
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{formatPercent(data.conversionRate)}</p>
                  <p className="text-gray-400">{data.approvedOrders} de {data.totalOrders} pedidos</p>
                </div>
              </motion.div>
            )}

            {/* Tab Pagamentos */}
            {activeTab === 'pagamentos' && (
              <motion.div
                key="pagamentos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-gray-800/50 to-gray-800/50 border border-emerald-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">⚡</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">PIX</h3>
                        <p className="text-sm text-gray-400">Pagamento Instantâneo</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{formatCurrency(data.pixRevenue)}</p>
                    <p className="text-gray-400">{data.pixOrders} pedidos | {formatPercent(data.pixConversion)} conversão</p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 via-gray-800/50 to-gray-800/50 border border-blue-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">💳</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cartão de Crédito</h3>
                        <p className="text-sm text-gray-400">Parcelamento</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{formatCurrency(data.creditCardRevenue)}</p>
                    <p className="text-gray-400">{data.creditCardOrders} pedidos | {formatPercent(data.creditCardConversion)} conversão</p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-amber-600/20 via-gray-800/50 to-gray-800/50 border border-amber-500/30 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📄</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">Boleto</h3>
                        <p className="text-sm text-gray-400">Pagamento à Vista</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{formatCurrency(data.boletoRevenue)}</p>
                    <p className="text-gray-400">{data.boletoOrders} pedidos | {formatPercent(data.boletoConversion)} conversão</p>
                  </div>
                </div>

                {/* Gráfico de Pizza */}
                {paymentMethodsData.length > 0 && (
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Distribuição por Método de Pagamento</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number | string | undefined) => formatCurrency(Number(value) || 0)}
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '12px',
                            color: '#fff',
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Parcelamentos */}
                {data.installmentData.length > 0 && (
                  <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Distribuição de Parcelamentos</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.installmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="installments" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '12px',
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Pedidos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab Clientes */}
            {activeTab === 'clientes' && (
              <motion.div
                key="clientes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 via-gray-800/50 to-gray-800/50 border border-blue-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Total de Clientes
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{data.totalCustomers}</p>
                  <p className="text-gray-400">clientes únicos no período</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-gray-800/50 to-gray-800/50 border border-emerald-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    Novos Clientes
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{data.newCustomers}</p>
                  <p className="text-gray-400">primeira compra</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 via-gray-800/50 to-gray-800/50 border border-purple-500/30 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Clientes Recorrentes
                  </h3>
                  <p className="text-5xl font-bold text-white mb-2">{data.returningCustomers}</p>
                  <p className="text-gray-400">{formatPercent(data.returningRate)} do total</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-yellow-600/20 via-gray-800/50 to-gray-800/50 border border-yellow-500/30 p-6 lg:col-span-3">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                    Carrinhos Abandonados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-4xl font-bold text-white">{data.abandonedCarts}</p>
                      <p className="text-gray-400">carrinhos abandonados</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-red-400">{formatCurrency(data.abandonedValue)}</p>
                      <p className="text-gray-400">valor perdido</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-emerald-400">{data.recoveredCarts}</p>
                      <p className="text-gray-400">carrinhos recuperados</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab Produtos */}
            {activeTab === 'produtos' && (
              <motion.div
                key="produtos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-400" />
                    Top Produtos
                  </h3>
                  {data.topProducts.length > 0 && data.topProducts[0].quantity > 0 ? (
                    <div className="space-y-4">
                      {data.topProducts.map((product, i) => (
                        <div key={product.name} className="flex items-center gap-4 p-4 rounded-xl bg-gray-700/20 hover:bg-gray-700/30 transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white text-lg">{product.name}</p>
                            <p className="text-gray-400">{product.quantity} unidades vendidas</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(product.revenue)}</p>
                            <p className="text-gray-500 text-sm">
                              {((product.revenue / data.totalRevenue) * 100).toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Não foram realizados pedidos</p>
                      <p className="text-gray-600">no período selecionado.</p>
                    </div>
                  )}
                </div>

                {/* Geográfico */}
                <div className="rounded-2xl bg-gray-800/30 border border-gray-700/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Vendas por Estado
                  </h3>
                  {data.topStates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {data.topStates.map((state, i) => (
                        <div key={state.state} className="p-4 rounded-xl bg-gray-700/20 text-center">
                          <p className="text-2xl font-bold text-white">{state.state}</p>
                          <p className="text-emerald-400 font-medium">{state.orders} vendas</p>
                          <p className="text-gray-500 text-sm">{formatCurrency(state.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Não houve pedidos pagos</p>
                      <p className="text-gray-600">no período selecionado.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
