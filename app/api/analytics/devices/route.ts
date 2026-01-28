import { NextResponse } from 'next/server';
import { getDevices } from '@/lib/google-analytics';

export async function GET() {
  try {
    const data = await getDevices();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
