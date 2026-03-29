'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  data: DonutItem[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({ title, data, height = 280, innerRadius = 60, outerRadius = 100 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
              formatter={(value: any, name: any) => [`${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`, name]}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
