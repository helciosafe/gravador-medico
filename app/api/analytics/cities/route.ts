import { NextResponse } from 'next/server';
import { getTopCities } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getTopCities();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
