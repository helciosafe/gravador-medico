import { NextRequest, NextResponse } from 'next/server'
import { getIntegrationLogs } from '@/services/lovable-integration'

// GET: Buscar logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || undefined
    const status = searchParams.get('status') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    const result = await getIntegrationLogs({
      action: action as any,
      status: status as any,
      limit
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
