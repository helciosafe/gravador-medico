import { NextResponse } from 'next/server';
import { getBrowsers } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getBrowsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar navegadores:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
