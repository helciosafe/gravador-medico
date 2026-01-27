import { NextRequest, NextResponse } from 'next/server'
import { 
  listLovableUsers, 
  createLovableUser, 
  resetLovableUserPassword,
  deactivateLovableUser,
  reactivateLovableUser,
  deleteLovableUser 
} from '@/services/lovable-integration'

// GET: Listar usuários
export async function GET(request: NextRequest) {
  try {
    const result = await listLovableUsers()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing Lovable users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Criar usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await createLovableUser({ email, password, full_name })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating Lovable user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Resetar senha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await resetLovableUserPassword({ userId, newPassword })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Desativar/Reativar usuário
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and action' },
        { status: 400 }
      )
    }

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json(
        { error: 'Invalid action. Use "ban" or "unban"' },
        { status: 400 }
      )
    }

    const result = action === 'ban' 
      ? await deactivateLovableUser(userId)
      : await reactivateLovableUser(userId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Excluir usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    const result = await deleteLovableUser(userId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
