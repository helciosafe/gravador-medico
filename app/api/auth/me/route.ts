import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Pegar token do header Authorization
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Verificar token e buscar usuário
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou usuário não encontrado' },
        { status: 401 }
      )
    }

    // Retornar dados do usuário (sem informações sensíveis)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        has_access: user.has_access,
      }
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}
