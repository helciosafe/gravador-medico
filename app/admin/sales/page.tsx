"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  Package
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Sale {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  discount: number
  subtotal: number
  status: string
  payment_method: string
  created_at: string
  appmax_order_id: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setRefreshing(true)
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar vendas:', error)
      } else {
        setSales(data || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

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

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.appmax_order_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calcular totais
  const totalRevenue = filteredSales
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + Number(s.total_amount), 0)
  
  const totalSales = filteredSales.length
  const approvedSales = filteredSales.filter(s => s.status === 'approved').length
  const pendingSales = filteredSales.filter(s => s.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Carregando vendas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Vendas</h1>
          <p className="text-gray-400 mt-1">Gerencie todas as transações</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadSales}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Faturamento</p>
          <p className="text-2xl font-black text-white mt-1">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-10 h-10 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Total de Vendas</p>
          <p className="text-2xl font-black text-white mt-1">{totalSales}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Aprovadas</p>
          <p className="text-2xl font-black text-white mt-1">{approvedSales}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-2">
            <Package className="w-10 h-10 text-yellow-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Pendentes</p>
          <p className="text-2xl font-black text-white mt-1">{pendingSales}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por cliente, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="all">Todos os Status</option>
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="rejected">Recusado</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID Pedido</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Método</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-400">#{sale.appmax_order_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-white">{sale.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{sale.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">{sale.customer_phone || '-'}</div>
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

        {filteredSales.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Aguardando a primeira venda via webhook da Appmax'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
