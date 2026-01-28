'use client'

/**
 * 👥 Realtime Visitors Widget (Google Analytics 4)
 * Mostra visitantes online agora via GA4 Data API
 * Atualização a cada 5 segundos via polling
 */

import { useEffect, useState } from 'react'
import { Users, Smartphone, Monitor, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RealtimeData {
  activeUsers: number
  pages: { page: string; users: number }[]
}

export function RealtimeVisitors() {
  const [data, setData] = useState<RealtimeData>({
    activeUsers: 0,
    pages: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 🔄 Função que busca dados do Google Analytics 4
    const fetchOnline = async () => {
      try {
        const response = await fetch('/api/analytics/realtime', {
          credentials: 'include'
        })

        if (!response.ok) {
          console.error('❌ Erro ao buscar visitantes GA4')
          return
        }

        const result = await response.json()
        setData({
          activeUsers: result.activeUsers || 0,
          pages: result.pages || []
        })
        
        setIsLoading(false)
      } catch (err) {
        console.error('❌ Exceção ao buscar visitantes:', err)
        setIsLoading(false)
      }
    }

    fetchOnline() // Busca inicial
    
    // ⏱️ Atualiza a cada 5 segundos
    const interval = setInterval(fetchOnline, 5000) 

    return () => clearInterval(interval)
  }, [])

  // Pegar top página ativa
  const topPage = data.pages.length > 0 ? data.pages[0] : null

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
      {/* Efeito de fundo sutil */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Users size={96} className="text-brand-400" />
      </div>

      <div className="flex flex-col relative z-10">
        {/* Header com badge GA4 */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
              Visitantes Online
            </h3>
            <span className="text-[10px] text-orange-400 font-medium">Google Analytics 4</span>
          </div>
        </div>
        
        {/* Número Grande com Animação */}
        <div className="mt-4 flex items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.span 
              key={data.activeUsers}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-5xl font-black text-white tracking-tight"
            >
              {isLoading ? '...' : data.activeUsers}
            </motion.span>
          </AnimatePresence>

          {/* O "Pulse" Animado (O charme do componente) */}
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/40">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-black text-green-400 uppercase tracking-wider">
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Top Páginas Ativas */}
        {data.pages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Páginas Ativas</p>
            {data.pages.slice(0, 3).map((page, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 truncate max-w-[180px]">{page.page}</span>
                <span className="text-white font-bold">{page.users}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Atualiza a cada 5 segundos (GA4 Realtime)
        </p>
      </div>
    </div>
  )
}
