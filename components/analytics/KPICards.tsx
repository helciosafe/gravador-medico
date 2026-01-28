'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, MousePointerClick, Clock } from 'lucide-react';

interface KPIsData {
  totalUsers: number;
  totalViews: number;
  totalEvents: number;
  totalSessions: number;
}

export function KPICards() {
  const [data, setData] = useState<KPIsData>({ totalUsers: 0, totalViews: 0, totalEvents: 0, totalSessions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/kpis');
        const result = await response.json();
        if (!result.error) {
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao buscar KPIs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const kpis = [
    {
      title: 'Total de Usuários',
      value: data.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Visualizações',
      value: data.totalViews,
      icon: Eye,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Eventos',
      value: data.totalEvents,
      icon: MousePointerClick,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Sessões',
      value: data.totalSessions,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpi.value.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
