'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelItem {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  title: string;
  data: FunnelItem[];
}

export function FunnelChart({ title, data }: FunnelChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-8 w-full rounded-lg bg-muted overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
