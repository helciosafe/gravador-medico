import { NextResponse } from 'next/server';
import { getTrafficSources } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getTrafficSources();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar origem de tráfego:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar origem de tráfego' },
      { status: 500 }
    );
  }
}
