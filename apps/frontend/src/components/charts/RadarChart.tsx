'use client';

import {
  Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RadarChartProps {
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  color?: string;
  height?: number;
}

export function RadarChartWrapper({ title, data, dataKey, nameKey, color = '#3b82f6', height = 300 }: RadarChartProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid className="stroke-border" />
            <PolarAngleAxis dataKey={nameKey} className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} />
            <PolarRadiusAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
              }}
            />
            <Radar dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
          </RechartsRadar>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
