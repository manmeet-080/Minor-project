'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HorizontalBarChartProps {
  title: string;
  data: { name: string; value: number; color?: string }[];
  color?: string;
  height?: number;
}

export function HorizontalBarChart({ title, data, color = '#3b82f6', height = 300 }: HorizontalBarChartProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis dataKey="name" type="category" className="text-xs" tick={{ fill: 'currentColor' }} width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
