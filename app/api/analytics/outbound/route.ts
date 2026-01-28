import { NextResponse } from 'next/server';
import { getOutboundClicks } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache 5 minutos

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30daysAgo';
    
    // Validar período
    const validPeriods = ['7daysAgo', '30daysAgo', '90daysAgo'];
    const dateRange = validPeriods.includes(period) 
      ? period as '7daysAgo' | '30daysAgo' | '90daysAgo'
      : '30daysAgo';
    
    const data = await getOutboundClicks(dateRange);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar cliques de saída:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados do Google Analytics',
        clicks: [],
        summary: {
          whatsapp: 0,
          appstore: 0,
          playstore: 0,
          external: 0,
          total: 0,
        }
      },
      { status: 500 }
    );
  }
}
