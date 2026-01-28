import { NextResponse } from 'next/server';
import { getRealtimeDetailed } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getRealtimeDetailed();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados detalhados em tempo real:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
