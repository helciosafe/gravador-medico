'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Eye } from 'lucide-react';

interface PageData {
  title: string;
  views: number;
}

export function TopPagesTable() {
  const [data, setData] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/top-pages');
        const result = await response.json();
        if (!result.error) {
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao buscar top páginas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const maxViews = data.length > 0 ? Math.max(...data.map((d) => d.views)) : 1;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Páginas Mais Visitadas
        </CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum dado disponível
            </p>
          ) : (
            data.map((page, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 font-medium" title={page.title}>
                    {page.title}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 ml-2">
                    <Eye className="h-3 w-3" />
                    {page.views.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(page.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
