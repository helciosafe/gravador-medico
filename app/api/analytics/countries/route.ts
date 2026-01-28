import { NextResponse } from 'next/server';
import { getTopCountries } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getTopCountries();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar top países:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar top países' },
      { status: 500 }
    );
  }
}
