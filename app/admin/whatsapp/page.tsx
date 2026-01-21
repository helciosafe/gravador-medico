// ================================================================
// Página: WhatsApp Inbox (Admin)
// ================================================================
// Tela completa estilo WhatsApp Web com lista de conversas e chat
// ================================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getWhatsAppConversations,
  getWhatsAppMessages,
  markConversationAsRead,
  getWhatsAppStats
} from '@/lib/whatsapp-db'
import type { WhatsAppConversation, WhatsAppMessage } from '@/lib/types/whatsapp'
import ChatLayout from '@/components/whatsapp/ChatLayout'
import ContactList from '@/components/whatsapp/ContactList'
import MessageBubble from '@/components/whatsapp/MessageBubble'
import { Send, Search, RefreshCw, MessageSquare } from 'lucide-react'

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedRemoteJid, setSelectedRemoteJid] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ totalContacts: 0, totalMessages: 0, totalUnread: 0 })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar conversas
  useEffect(() => {
    loadConversations()
    loadStats()
  }, [])

  // Carregar mensagens quando selecionar conversa
  useEffect(() => {
    if (selectedRemoteJid) {
      loadMessages(selectedRemoteJid)
      markAsRead(selectedRemoteJid)
    }
  }, [selectedRemoteJid])

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // ================================================================
  // REALTIME: Escutar novas mensagens e atualizações de contatos
  // ================================================================
  useEffect(() => {
    console.log('🔌 Conectando ao Supabase Realtime...')
    
    const channel = supabaseAdmin
      .channel('whatsapp-realtime-inbox')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        (payload) => {
          console.log('📩 Nova mensagem recebida via Realtime:', payload.new)
          
          const newMessage = payload.new as WhatsAppMessage
          
          // Se a mensagem pertence ao chat atual aberto
          if (newMessage.remote_jid === selectedRemoteJid) {
            console.log('✅ Mensagem do chat atual - Adicionando ao estado')
            setMessages((prev) => {
              // Evitar duplicatas
              const exists = prev.some(msg => msg.id === newMessage.id)
              if (exists) return prev
              return [...prev, newMessage]
            })
            
            // Scroll automático para a nova mensagem
            setTimeout(() => scrollToBottom(), 100)
          }
          
          // Atualizar lista de conversas (sidebar) para mostrar última mensagem
          loadConversations()
          loadStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_contacts'
        },
        (payload) => {
          console.log('🔄 Contato atualizado via Realtime:', payload.new)
          
          // Atualizar lista de conversas para refletir mudanças
          setConversations((prev) => {
            const updated = prev.map((conv) => {
              if (conv.remote_jid === (payload.new as any).remote_jid) {
                return { ...conv, ...payload.new } as WhatsAppConversation
              }
              return conv
            })
            
            // Reordenar por última mensagem
            return updated.sort((a, b) => {
              const dateA = a.last_message_timestamp ? new Date(a.last_message_timestamp).getTime() : 0
              const dateB = b.last_message_timestamp ? new Date(b.last_message_timestamp).getTime() : 0
              return dateB - dateA
            })
          })
          
          loadStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_contacts'
        },
        (payload) => {
          console.log('➕ Novo contato adicionado via Realtime:', payload.new)
          
          // Adicionar novo contato à lista se não existir
          setConversations((prev) => {
            const exists = prev.some(conv => conv.remote_jid === (payload.new as any).remote_jid)
            if (exists) return prev
            
            return [payload.new as WhatsAppConversation, ...prev]
          })
          
          loadStats()
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão Realtime:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao Supabase Realtime!')
        }
      })

    // Cleanup: Remover canal ao desmontar componente
    return () => {
      console.log('🔌 Desconectando do Supabase Realtime...')
      supabaseAdmin.removeChannel(channel)
    }
  }, [selectedRemoteJid]) // Re-subscribe quando mudar o chat selecionado

  async function loadConversations() {
    try {
      const data = await getWhatsAppConversations()
      setConversations(data)
      setLoading(false)
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error)
      setLoading(false)
    }
  }

  async function loadMessages(remoteJid: string) {
    setLoadingMessages(true)
    try {
      const data = await getWhatsAppMessages(remoteJid, 200)
      setMessages(data)
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  async function markAsRead(remoteJid: string) {
    try {
      await markConversationAsRead(remoteJid)
      // Atualizar localmente
      setConversations((prev) =>
        prev.map((c) =>
          c.remote_jid === remoteJid ? { ...c, unread_count: 0 } : c
        )
      )
      loadStats()
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
    }
  }

  async function loadStats() {
    try {
      const data = await getWhatsAppStats()
      setStats(data)
    } catch (error) {
      console.error('❌ Erro ao carregar stats:', error)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectedConversation = conversations.find(
    (c) => c.remote_jid === selectedRemoteJid
  )

  const filteredConversations = conversations.filter((c) => {
    const name = c.name || c.push_name || c.remote_jid
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <ChatLayout
      sidebar={
        <>
          {/* Header da sidebar - Estilo WhatsApp */}
          <div className="h-[60px] bg-[#202c33] border-b border-gray-700 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar do usuário */}
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-gray-300" />
              </div>
            </div>

            {/* Ícones de ação */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadConversations()
                  loadStats()
                }}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                title="Atualizar conversas"
              >
                <RefreshCw className="w-5 h-5 text-gray-300 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Busca - Estilo WhatsApp */}
          <div className="px-3 py-2 bg-[#111b21]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-[#202c33] text-white text-sm rounded-lg focus:outline-none placeholder-gray-500"
              />
            </div>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto bg-[#111b21]">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Carregando conversas...</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <ContactList
                conversations={filteredConversations}
                selectedRemoteJid={selectedRemoteJid || undefined}
                onSelectConversation={setSelectedRemoteJid}
              />
            )}
          </div>
        </>
      }
    >
      {selectedConversation ? (
        <>
          {/* Header do chat - Estilo WhatsApp */}
          <div className="h-[60px] bg-[#202c33] border-b border-gray-700 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {selectedConversation.profile_picture_url ? (
                <img
                  src={selectedConversation.profile_picture_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center text-white font-bold text-sm">
                  {(selectedConversation.name?.[0] || selectedConversation.push_name?.[0] || '?').toUpperCase()}
                </div>
              )}
              
              {/* Nome e info */}
              <div>
                <h3 className="font-medium text-white text-[16px]">
                  {selectedConversation.name ||
                    selectedConversation.push_name ||
                    selectedConversation.remote_jid}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedConversation.total_messages} mensagens
                </p>
              </div>
            </div>

            {/* Ícones de ação */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                <Search className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>

          {/* Área de mensagens - Background WhatsApp */}
          <div
            className="flex-1 overflow-y-auto p-4 bg-[#0b141a]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='pattern' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 20 Q10 10 20 20 T40 20' stroke='%23ffffff' stroke-width='0.3' fill='none' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23pattern)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '400px 400px'
            }}
          >
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Carregando mensagens...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input de mensagem - Estilo WhatsApp */}
          <div className="bg-[#202c33] border-t border-gray-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Escrever uma mensagem"
                disabled
                className="flex-1 px-4 py-2 bg-[#2a3942] text-white rounded-lg text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500"
              />
              <button
                disabled
                className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#00a884]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Recurso de envio em breve
            </p>
          </div>
        </>
      ) : (
        // Estado vazio - Estilo WhatsApp
        <div className="flex-1 flex items-center justify-center bg-[#222e35] border-l border-gray-700">
          <div className="text-center text-gray-400">
            <div className="w-48 h-48 mx-auto mb-6 bg-[#202c33] rounded-full flex items-center justify-center">
              <MessageSquare className="w-24 h-24 opacity-20" />
            </div>
            <h3 className="text-2xl font-light mb-2 text-gray-300">WhatsApp Inbox</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Selecione uma conversa à esquerda para visualizar as mensagens
            </p>
          </div>
        </div>
      )}
    </ChatLayout>
  )
}
