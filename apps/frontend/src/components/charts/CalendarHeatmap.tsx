'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarHeatmapProps {
  title: string;
  data: Record<string, number>; // { "2026-03-15": 5, ... }
  color?: string;
}

function getOpacity(value: number, max: number): number {
  if (value === 0) return 0.05;
  return 0.15 + (value / max) * 0.85;
}

export function CalendarHeatmap({ title, data, color = '#3b82f6' }: CalendarHeatmapProps) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...Object.values(data), 1);

  // Show last 12 weeks (84 days)
  const today = new Date();
  const days: { date: string; value: number; dayOfWeek: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, value: data[key] || 0, dayOfWeek: d.getDay() });
  }

  // Group into weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger
                    className="h-3 w-3 rounded-sm cursor-default"
                    style={{
                      backgroundColor: color,
                      opacity: getOpacity(day.value, max),
                    }}
                  />
                  <TooltipContent className="text-xs">
                    {day.date}: {day.value} visits
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          {[0.05, 0.25, 0.5, 0.75, 1].map((opacity) => (
            <div
              key={opacity}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: color, opacity }}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
