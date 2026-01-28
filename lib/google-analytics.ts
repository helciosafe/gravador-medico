import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Função para obter as credenciais do Google
// Suporta 2 métodos:
// 1. GOOGLE_APPLICATION_CREDENTIALS_JSON - JSON completo das credenciais
// 2. GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY - variáveis separadas
function getCredentials() {
  // Método 1: JSON completo
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      // Se a private_key tem \n literal, converte
      if (creds.private_key && creds.private_key.includes('\\n')) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      return creds;
    } catch (e) {
      console.error('Erro ao parsear GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    }
  }
  
  // Método 2: Variáveis separadas
  const key = process.env.GOOGLE_PRIVATE_KEY;
  let privateKey: string | undefined;
  
  if (key) {
    // Verifica se contém \n literal (escapado) e converte
    privateKey = key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
  }
  
  return {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  };
}

// Inicializa o cliente do Google Analytics Data API
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: getCredentials(),
  projectId: process.env.GOOGLE_PROJECT_ID,
});

export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

// =====================================================
// FUNÇÕES DE BUSCA DE DADOS DO GA4
// =====================================================

/**
 * Busca dados em tempo real (usuários ativos agora)
 */
export async function getRealtimeData() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dimensions: [{ name: 'unifiedScreenName' }],
    metrics: [{ name: 'activeUsers' }],
  });

  const activeUsers = response.rows?.reduce((total, row) => {
    return total + parseInt(row.metricValues?.[0]?.value || '0', 10);
  }, 0) || 0;

  const pages = response.rows?.map((row) => ({
    page: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })).slice(0, 5) || [];

  return { activeUsers, pages };
}

/**
 * Busca tráfego dos últimos 7 dias (para o gráfico principal)
 */
export async function getTrafficData() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });

  return response.rows?.map((row) => {
    const dateString = row.dimensionValues?.[0]?.value || '';
    const day = dateString.slice(6, 8);
    const month = dateString.slice(4, 6);

    return {
      date: `${day}/${month}`,
      usuarios: parseInt(row.metricValues?.[0]?.value || '0', 10),
      visualizacoes: parseInt(row.metricValues?.[1]?.value || '0', 10),
    };
  }) || [];
}

/**
 * Busca top páginas mais visitadas
 */
export async function getTopPages() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  return response.rows?.map((row) => ({
    title: row.dimensionValues?.[0]?.value || 'Sem título',
    views: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })) || [];
}

/**
 * Busca origem de tráfego (de onde vêm os usuários)
 */
export async function getTrafficSources() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return response.rows?.map((row, index) => ({
    source: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
    color: colors[index % colors.length],
  })) || [];
}

/**
 * Busca top países
 */
export async function getTopCountries() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5,
  });

  return response.rows?.map((row) => ({
    country: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })) || [];
}

/**
 * Busca KPIs resumidos (totais dos últimos 7 dias)
 */
export async function getKPIs() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'eventCount' },
      { name: 'sessions' },
    ],
  });

  const row = response.rows?.[0];
  return {
    totalUsers: parseInt(row?.metricValues?.[0]?.value || '0', 10),
    totalViews: parseInt(row?.metricValues?.[1]?.value || '0', 10),
    totalEvents: parseInt(row?.metricValues?.[2]?.value || '0', 10),
    totalSessions: parseInt(row?.metricValues?.[3]?.value || '0', 10),
  };
}

/**
 * Busca dados demográficos: cidades
 */
export async function getTopCities() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10,
  });

  return response.rows?.map((row) => ({
    city: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })).filter(c => c.city !== '(not set)') || [];
}

/**
 * Busca dados demográficos: faixa etária
 */
export async function getAgeGroups() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'userAgeBracket' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'userAgeBracket' } }],
  });

  return response.rows?.map((row) => ({
    age: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })).filter(a => a.age !== '(not set)') || [];
}

/**
 * Busca dados de dispositivos
 */
export async function getDevices() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });

  return response.rows?.map((row) => ({
    device: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })) || [];
}

/**
 * Busca dados de navegadores
 */
export async function getBrowsers() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'browser' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  return response.rows?.map((row) => ({
    browser: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })) || [];
}

/**
 * Busca dados em tempo real com mais detalhes (cidade, dispositivo)
 */
export async function getRealtimeDetailed() {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  // Buscar usuários por cidade em tempo real
  const [cityResponse] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'activeUsers' }],
  });

  // Buscar usuários por dispositivo em tempo real
  const [deviceResponse] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
  });

  // Buscar usuários por país em tempo real
  const [countryResponse] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
  });

  const cities = cityResponse.rows?.map((row) => ({
    city: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })).filter(c => c.city !== '(not set)').slice(0, 5) || [];

  const devices = deviceResponse.rows?.map((row) => ({
    device: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })) || [];

  const countries = countryResponse.rows?.map((row) => ({
    country: row.dimensionValues?.[0]?.value || 'Desconhecido',
    users: parseInt(row.metricValues?.[0]?.value || '0', 10),
  })).slice(0, 5) || [];

  // Total de usuários ativos
  const totalActiveUsers = devices.reduce((sum, d) => sum + d.users, 0);

  return {
    activeUsers: totalActiveUsers,
    cities,
    devices,
    countries,
  };
}

/**
 * Busca cliques de saída (outbound clicks) - para onde os usuários estão indo
 */
export async function getOutboundClicks(dateRange: '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo') {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  try {
    // Busca eventos de clique em links externos
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: dateRange, endDate: 'today' }],
      dimensions: [{ name: 'linkUrl' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'click',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    });

    const clicks = response.rows?.map((row) => {
      const url = row.dimensionValues?.[0]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
      
      // Classificar o destino
      let category: 'whatsapp' | 'appstore' | 'playstore' | 'external' | 'internal' = 'external';
      let label = 'Externo';
      
      if (url.includes('wa.me') || url.includes('whatsapp')) {
        category = 'whatsapp';
        label = 'WhatsApp';
      } else if (url.includes('apps.apple.com') || url.includes('itunes.apple.com')) {
        category = 'appstore';
        label = 'App Store';
      } else if (url.includes('play.google.com')) {
        category = 'playstore';
        label = 'Play Store';
      } else if (url.includes(process.env.NEXT_PUBLIC_SITE_URL || '') || url.startsWith('/')) {
        category = 'internal';
        label = 'Interno';
      }
      
      return {
        url,
        clicks: count,
        category,
        label,
      };
    }).filter(c => c.url && c.category !== 'internal') || [];

    // Agrupar por categoria
    const summary = {
      whatsapp: clicks.filter(c => c.category === 'whatsapp').reduce((sum, c) => sum + c.clicks, 0),
      appstore: clicks.filter(c => c.category === 'appstore').reduce((sum, c) => sum + c.clicks, 0),
      playstore: clicks.filter(c => c.category === 'playstore').reduce((sum, c) => sum + c.clicks, 0),
      external: clicks.filter(c => c.category === 'external').reduce((sum, c) => sum + c.clicks, 0),
      total: clicks.reduce((sum, c) => sum + c.clicks, 0),
    };

    return {
      clicks: clicks.slice(0, 20),
      summary,
    };
  } catch (error) {
    console.error('Erro ao buscar cliques de saída:', error);
    return {
      clicks: [],
      summary: {
        whatsapp: 0,
        appstore: 0,
        playstore: 0,
        external: 0,
        total: 0,
      },
    };
  }
}

/**
 * Busca eventos de vídeo (video views, video progress, video complete)
 */
export async function getVideoEvents(dateRange: '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo') {
  if (!GA4_PROPERTY_ID) throw new Error('GA4_PROPERTY_ID não configurado');

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: dateRange, endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'video',
          },
        },
      },
    });

    const events: Record<string, number> = {};
    response.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
      events[eventName] = count;
    });

    return {
      videoStart: events['video_start'] || 0,
      videoProgress: events['video_progress'] || 0,
      videoComplete: events['video_complete'] || 0,
      totalVideoEvents: Object.values(events).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    console.error('Erro ao buscar eventos de vídeo:', error);
    return {
      videoStart: 0,
      videoProgress: 0,
      videoComplete: 0,
      totalVideoEvents: 0,
    };
  }
}

export { analyticsDataClient };
