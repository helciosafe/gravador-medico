// ================================================================
// NotificationBell - Sininho de notificações (DockSidebar)
// ================================================================

'use client'

import { MessageSquare } from 'lucide-react'
import { useNotifications } from './NotificationProvider'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    
    const meta = notification.metadata
    if (!meta) {
      setIsOpen(false)
      return
    }

    // Redirecionar baseado no tipo
    if (notification.type === 'whatsapp_message' && meta.whatsapp_remote_jid) {
      router.push(`/admin/whatsapp?chat=${encodeURIComponent(meta.whatsapp_remote_jid)}`)
    } else if (notification.type === 'admin_chat_message' && meta.admin_chat_conversation_id) {
      router.push(`/admin/chat?conversation=${meta.admin_chat_conversation_id}`)
    }
    
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Botão do Sininho */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notificações"
      >
        <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel de Notificações */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar/Ícone */}
                        {notification.metadata?.profile_picture_url ? (
                          <img
                            src={notification.metadata.profile_picture_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                        )}

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>

                        {/* Indicador não lida */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
