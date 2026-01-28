'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';

interface CountryData {
  country: string;
  users: number;
}

// Mapeamento de países para bandeiras (emoji)
const countryFlags: Record<string, string> = {
  'Brazil': '🇧🇷',
  'United States': '🇺🇸',
  'Portugal': '🇵🇹',
  'Argentina': '🇦🇷',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'Colombia': '🇨🇴',
  'Chile': '🇨🇱',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Italy': '🇮🇹',
  'Japan': '🇯🇵',
  'Ireland': '🇮🇪',
};

const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export function CountriesChart() {
  const [data, setData] = useState<CountryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/countries');
        const result = await response.json();
        if (!result.error) {
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao buscar países:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    flag: countryFlags[item.country] || '🌍',
    displayName: `${countryFlags[item.country] || '🌍'} ${item.country}`,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Top Países
        </CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CountryData & { flag: string };
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2">
                          <p className="font-medium">{data.flag} {data.country}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {data.users.toLocaleString('pt-BR')} usuários
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="users" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
