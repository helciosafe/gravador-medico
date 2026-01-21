'use client'

/**
 * 👥 Realtime Visitors Widget
 * Mostra visitantes online agora (estilo Google Analytics)
 * Atualização a cada 5 segundos via polling
 */

import { useEffect, useState } from 'react'
import { Users, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VisitorsOnline {
  online_count: number
  mobile_count: number
  desktop_count: number
}

export function RealtimeVisitors() {
  const [data, setData] = useState<VisitorsOnline>({
    online_count: 0,
    mobile_count: 0,
    desktop_count: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 🔄 Função que busca o número na View SQL otimizada
    const fetchOnline = async () => {
      try {
        const response = await fetch('/api/admin/analytics/online', {
          credentials: 'include'
        })

        if (!response.ok) {
          console.error('❌ Erro ao buscar visitantes online')
          return
        }

        const result = await response.json()
        setData({
          online_count: result.online_count || 0,
          mobile_count: result.mobile_count || 0,
          desktop_count: result.desktop_count || 0
        })
        
        setIsLoading(false)
      } catch (err) {
        console.error('❌ Exceção ao buscar visitantes:', err)
        setIsLoading(false)
      }
    }

    fetchOnline() // Busca inicial
    
    // ⏱️ Atualiza a cada 3 segundos (mais rápido para feedback instantâneo)
    const interval = setInterval(fetchOnline, 3000) 

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
      {/* Efeito de fundo sutil */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Users size={96} className="text-brand-400" />
      </div>

      <div className="flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">
            Visitantes Online
          </h3>
        </div>
        
        {/* Número Grande com Animação */}
        <div className="mt-4 flex items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.span 
              key={data.online_count}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-5xl font-black text-white tracking-tight"
            >
              {isLoading ? '...' : data.online_count}
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

        {/* Breakdown por Dispositivo */}
        <div className="mt-4 flex gap-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mobile</p>
              <p className="text-lg font-bold text-white">{data.mobile_count}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Desktop</p>
              <p className="text-lg font-bold text-white">{data.desktop_count}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Atualiza a cada 5 segundos (Janela de 5 min)
        </p>
      </div>
    </div>
  )
}
