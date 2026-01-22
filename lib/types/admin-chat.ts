// ================================================================
// Types para Chat Interno entre Administradores
// ================================================================

export interface AdminChatConversation {
  id: string
  type: 'direct' | 'group'
  name?: string
  
  created_by?: string
  created_at: string
  updated_at: string
  
  // Última mensagem (denormalizada)
  last_message_content?: string
  last_message_timestamp?: string
  last_message_from?: string
  
  // Dados extras (da VIEW)
  participant_count?: number
  participant_ids?: string[]
  message_count?: number
}

export interface AdminChatParticipant {
  id: string
  conversation_id: string
  user_id: string
  unread_count: number
  last_read_at?: string
  joined_at: string
}

export interface AdminChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  
  content?: string
  message_type: 'text' | 'image' | 'file'
  media_url?: string
  file_name?: string
  file_size?: number
  
  created_at: string
  updated_at: string
  deleted_at?: string
  
  reply_to?: string
  
  // Dados extras (JOIN)
  sender_name?: string
  sender_email?: string
  sender_avatar?: string
}

// Para criar mensagem
export interface CreateAdminChatMessageInput {
  conversation_id: string
  sender_id: string
  content?: string
  message_type?: 'text' | 'image' | 'file'
  media_url?: string
  file_name?: string
  file_size?: number
  reply_to?: string
}

// Para listar conversas do usuário
export interface UserConversation extends AdminChatConversation {
  unread_count: number // Específico do usuário
  other_participant_name?: string // Se for direct, nome do outro
  other_participant_avatar?: string
  other_participant_email?: string
}
