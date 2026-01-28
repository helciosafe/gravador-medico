'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SourceData {
  source: string;
  users: number;
  color: string;
}

// Tradução das fontes de tráfego
const sourceTranslation: Record<string, string> = {
  'Direct': 'Direto',
  'Organic Search': 'Busca Orgânica',
  'Organic Social': 'Rede Social',
  'Paid Search': 'Busca Paga',
  'Paid Social': 'Social Pago',
  'Referral': 'Referência',
  'Email': 'E-mail',
  'Display': 'Display',
  'Affiliates': 'Afiliados',
  'Unassigned': 'Não Atribuído',
};

export function TrafficSourcesChart() {
  const [data, setData] = useState<SourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/sources');
        const result = await response.json();
        if (!result.error) {
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao buscar origens de tráfego:', error);
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
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: sourceTranslation[item.source] || item.source,
  }));

  const total = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Origem do Tráfego
        </CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="users"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as SourceData & { name: string };
                      const percentage = ((data.users / total) * 100).toFixed(1);
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.users.toLocaleString('pt-BR')} usuários ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
