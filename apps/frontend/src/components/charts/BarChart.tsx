'use client';

import { Bar, BarChart as RechartsBar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartProps {
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; color: string; label: string }[];
  height?: number;
}

export function BarChartWrapper({ title, data, xKey, yKeys, height = 300 }: BarChartProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBar data={data}>
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
              <Bar key={y.key} dataKey={y.key} fill={y.color} radius={[4, 4, 0, 0]} name={y.label} />
            ))}
          </RechartsBar>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
