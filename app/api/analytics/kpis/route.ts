import { NextResponse } from 'next/server';
import { getKPIs } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getKPIs();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar KPIs', totalUsers: 0, totalViews: 0, totalEvents: 0, totalSessions: 0 },
      { status: 500 }
    );
  }
}
