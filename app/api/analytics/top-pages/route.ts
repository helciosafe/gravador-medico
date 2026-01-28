import { NextResponse } from 'next/server';
import { getTopPages } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getTopPages();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar top páginas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar top páginas' },
      { status: 500 }
    );
  }
}
