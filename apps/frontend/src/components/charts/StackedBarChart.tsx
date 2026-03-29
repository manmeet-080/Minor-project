'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StackedBarChartProps {
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; color: string; label: string }[];
  height?: number;
}

export function StackedBarChart({ title, data, xKey, yKeys, height = 300 }: StackedBarChartProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
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
            <Legend
              formatter={(value: string) => <span className="text-xs">{value}</span>}
            />
            {yKeys.map((y) => (
              <Bar key={y.key} dataKey={y.key} stackId="stack" fill={y.color} name={y.label} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
