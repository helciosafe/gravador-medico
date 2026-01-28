'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, AlertCircle } from 'lucide-react';

interface TrafficData {
  date: string;
  usuarios: number;
  visualizacoes: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

// Tooltip customizado para o gráfico
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[150px]">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">Visualizações:</span>
            <span className="text-sm font-medium">{payload[0]?.value?.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-sm text-muted-foreground">Usuários:</span>
            <span className="text-sm font-medium">{payload[1]?.value?.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface AnalyticsChartProps {
  showHeader?: boolean;
  className?: string;
}

export function AnalyticsChart({ showHeader = true, className = '' }: AnalyticsChartProps) {
  const [data, setData] = useState<TrafficData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/analytics/traffic');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados');
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcula totais para exibir no header
  const totals = data.reduce(
    (acc, item) => ({
      usuarios: acc.usuarios + item.usuarios,
      visualizacoes: acc.visualizacoes + item.visualizacoes,
    }),
    { usuarios: 0, visualizacoes: 0 }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src="/Google-Analytics-Logo.png"
              alt="Google Analytics"
              width={24}
              height={24}
              className="brightness-0 invert"
            />
            Tráfego do Site
          </CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
            <p className="text-center font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-center mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image
                  src="/Google-Analytics-Logo.png"
                  alt="Google Analytics"
                  width={24}
                  height={24}
                  className="brightness-0 invert"
                />
                Tráfego do Site
              </CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Visualizações:</span>
                <span className="font-semibold">{totals.visualizacoes.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-violet-500" />
                <span className="text-muted-foreground">Usuários:</span>
                <span className="font-semibold">{totals.usuarios.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={!showHeader ? 'pt-6' : ''}>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Gradiente Azul para Visualizações */}
                <linearGradient id="colorVisualizacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                {/* Gradiente Roxo para Usuários */}
                <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={(value) => value.toLocaleString('pt-BR')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="visualizacoes"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVisualizacoes)"
              />
              <Area
                type="monotone"
                dataKey="usuarios"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsuarios)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
