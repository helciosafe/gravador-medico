// ================================================================
// Notification Provider - Context para notificações globais
// ================================================================

'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { Notification, NotificationContextValue } from '@/lib/types/notifications'
import { toast } from 'sonner'
import { supabaseAdmin } from '@/lib/supabase'
import type { WhatsAppMessage } from '@/lib/types/whatsapp'
import type { AdminChatMessage } from '@/lib/types/admin-chat'

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Calcular não lidas
  const unreadCount = notifications.filter(n => !n.read).length

  // Adicionar notificação
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'created_at' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Toast visual
    const toastTitle = notification.title
    const toastMessage = notification.message

    toast.success(toastTitle, {
      description: toastMessage,
      duration: 5000,
      action: notification.metadata ? {
        label: 'Ver',
        onClick: () => {
          // Redirecionar baseado no tipo
          const meta = notification.metadata
          if (!meta) return
          
          if (notification.type === 'whatsapp_message' && meta.whatsapp_remote_jid) {
            window.location.href = `/admin/whatsapp?chat=${encodeURIComponent(meta.whatsapp_remote_jid)}`
          } else if (notification.type === 'admin_chat_message' && meta.admin_chat_conversation_id) {
            window.location.href = `/admin/chat?conversation=${meta.admin_chat_conversation_id}`
          }
        }
      } : undefined
    })

    // Notificação do navegador (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(toastTitle, {
        body: toastMessage,
        icon: notification.metadata?.profile_picture_url || '/favicon.ico',
        badge: '/favicon.ico',
        tag: newNotification.id
      })
    }
  }, [])

  // Marcar como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Limpar todas
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Pedir permissão para notificações do navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ================================================================
  // REALTIME: Escutar mensagens WhatsApp e Chat Interno
  // ================================================================
  useEffect(() => {
    console.log('🔌 NotificationProvider: Conectando ao Realtime...')

    // Canal WhatsApp
    const whatsappChannel = supabaseAdmin
      .channel('global-whatsapp-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        async (payload) => {
          const newMessage = payload.new as WhatsAppMessage
          
          // Só notificar mensagens RECEBIDAS (não enviadas por mim)
          if (!newMessage.from_me) {
            // Buscar dados do contato
            const { data: contact } = await supabaseAdmin
              .from('whatsapp_contacts')
              .select('name, push_name, profile_picture_url')
              .eq('remote_jid', newMessage.remote_jid)
              .single()
            
            const contactName = contact?.name || contact?.push_name || newMessage.remote_jid.split('@')[0]
            
            addNotification({
              type: 'whatsapp_message',
              title: contactName,
              message: newMessage.content || '[Mídia]',
              metadata: {
                whatsapp_remote_jid: newMessage.remote_jid,
                profile_picture_url: contact?.profile_picture_url
              }
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 WhatsApp Realtime:', status)
      })

    // Canal Chat Interno
    const chatChannel = supabaseAdmin
      .channel('global-admin-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_chat_messages'
        },
        async (payload) => {
          const newMessage = payload.new as AdminChatMessage
          
          // Buscar dados do sender
          const { data: sender } = await supabaseAdmin
            .from('users')
            .select('name, email, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()
          
          const senderName = sender?.name || sender?.email || 'Admin'
          
          addNotification({
            type: 'admin_chat_message',
            title: senderName,
            message: newMessage.content || '[Mídia]',
            metadata: {
              admin_chat_conversation_id: newMessage.conversation_id,
              profile_picture_url: sender?.avatar_url
            }
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Admin Chat Realtime:', status)
      })

    return () => {
      supabaseAdmin.removeChannel(whatsappChannel)
      supabaseAdmin.removeChannel(chatChannel)
    }
  }, [addNotification])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
