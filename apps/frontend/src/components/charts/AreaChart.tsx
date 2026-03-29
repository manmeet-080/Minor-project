'use client';

import { Area, AreaChart as RechartsArea, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AreaChartProps {
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; color: string; label: string }[];
  height?: number;
}

export function AreaChartWrapper({ title, data, xKey, yKeys, height = 300 }: AreaChartProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsArea data={data}>
            <defs>
              {yKeys.map((y) => (
                <linearGradient key={y.key} id={`grad-${y.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={y.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={y.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
            {yKeys.map((y) => (
              <Area
                key={y.key}
                type="monotone"
                dataKey={y.key}
                stroke={y.color}
                fill={`url(#grad-${y.key})`}
                strokeWidth={2}
                name={y.label}
              />
            ))}
          </RechartsArea>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
