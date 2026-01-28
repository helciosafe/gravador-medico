import { NextResponse } from 'next/server';
import { getAgeGroups } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getAgeGroups();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar faixas etárias:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
