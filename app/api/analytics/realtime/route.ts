import { NextResponse } from 'next/server';
import { getRealtimeData } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getRealtimeData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados em tempo real:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados em tempo real', activeUsers: 0, pages: [] },
      { status: 500 }
    );
  }
}
