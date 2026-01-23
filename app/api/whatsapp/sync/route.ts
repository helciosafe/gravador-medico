// ================================================================
// API Route: Sincronizar Histórico (Trigger manual via dashboard)
// ================================================================
// POST /api/whatsapp/sync
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { syncAllConversations, syncConversationHistory } from '@/lib/whatsapp-sync'

const EVOLUTION_CONFIG = {
  apiUrl: process.env.EVOLUTION_API_URL!,
  apiKey: process.env.EVOLUTION_API_KEY!,
  instanceName: process.env.EVOLUTION_INSTANCE_NAME!
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, remoteJid, messagesLimit } = body

    // Validar configuração
    if (!EVOLUTION_CONFIG.apiUrl || !EVOLUTION_CONFIG.apiKey || !EVOLUTION_CONFIG.instanceName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Evolution API não configurada. Configure as variáveis de ambiente.' 
        },
        { status: 500 }
      )
    }

    // Sincronizar conversa específica
    if (action === 'sync-conversation' && remoteJid) {
      console.log(`🔄 Sincronizando conversa ${remoteJid}...`)
      
      try {
        const totalMessages = await syncConversationHistory(
          EVOLUTION_CONFIG,
          remoteJid,
          messagesLimit || 100
        )

        console.log(`✅ Sincronização concluída: ${totalMessages} mensagens`)

        return NextResponse.json({
          success: true,
          message: `${totalMessages} mensagens sincronizadas`,
          totalMessages
        })
      } catch (syncError) {
        console.error(`❌ ERRO CRÍTICO NO SYNC de ${remoteJid}:`, syncError)
        console.error('❌ Detalhes:', {
          name: syncError instanceof Error ? syncError.name : 'Unknown',
          message: syncError instanceof Error ? syncError.message : String(syncError),
          stack: syncError instanceof Error ? syncError.stack : 'N/A'
        })
        
        return NextResponse.json(
          {
            success: false,
            error: syncError instanceof Error ? syncError.message : 'Erro ao sincronizar conversa',
            details: syncError instanceof Error ? syncError.stack : undefined
          },
          { status: 500 }
        )
      }
    }

    // Sincronizar todas as conversas
    if (action === 'sync-all') {
      console.log('🚀 Sincronizando todas as conversas...')
      
      const result = await syncAllConversations(
        EVOLUTION_CONFIG,
        messagesLimit || 100
      )

      return NextResponse.json({
        success: true,
        message: 'Sincronização completa finalizada',
        ...result
      })
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Ação inválida. Use "sync-conversation" ou "sync-all"' 
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoints: {
      'POST /api/whatsapp/sync': {
        syncAll: { action: 'sync-all', messagesLimit: 100 },
        syncConversation: { action: 'sync-conversation', remoteJid: '552199999999@s.whatsapp.net', messagesLimit: 100 }
      }
    }
  })
}
