'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Eye } from 'lucide-react';

interface RealtimeData {
  activeUsers: number;
  pages: Array<{ page: string; users: number }>;
}

export function RealtimeCard() {
  const [data, setData] = useState<RealtimeData>({ activeUsers: 0, pages: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      const result = await response.json();
      if (!result.error) {
        setData(result);
      }
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-24 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Indicador de "ao vivo" */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-xs text-muted-foreground">Ao vivo</span>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-500" />
          Usuários Ativos Agora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-bold text-green-600 mb-4">
          {data.activeUsers}
        </div>
        
        {data.pages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Páginas sendo visualizadas
            </p>
            <div className="space-y-1.5">
              {data.pages.slice(0, 3).map((page, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    {page.page}
                  </span>
                  <span className="font-medium ml-2">{page.users}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
