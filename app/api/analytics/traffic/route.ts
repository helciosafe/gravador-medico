import { NextResponse } from 'next/server';
import { analyticsDataClient, GA4_PROPERTY_ID } from '@/lib/google-analytics';

export async function GET() {
  try {
    // Verifica se as variáveis de ambiente estão configuradas
    if (!GA4_PROPERTY_ID) {
      return NextResponse.json(
        { error: 'GA4_PROPERTY_ID não configurado' },
        { status: 500 }
      );
    }

    // Busca dados do Google Analytics 4
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: false,
        },
      ],
    });

    // Formata os dados para o Recharts
    const formattedData = response.rows?.map((row) => {
      const dateString = row.dimensionValues?.[0]?.value || '';
      // Formato original: YYYYMMDD -> DD/MM
      const day = dateString.slice(6, 8);
      const month = dateString.slice(4, 6);
      const formattedDate = `${day}/${month}`;

      return {
        date: formattedDate,
        usuarios: parseInt(row.metricValues?.[0]?.value || '0', 10),
        visualizacoes: parseInt(row.metricValues?.[1]?.value || '0', 10),
      };
    }) || [];

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados do GA4:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do Google Analytics' },
      { status: 500 }
    );
  }
}
