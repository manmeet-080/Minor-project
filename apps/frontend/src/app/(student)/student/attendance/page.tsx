'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, XCircle, Clock, Coffee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PRESENT: { label: 'Present', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  ABSENT: { label: 'Absent', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  LATE: { label: 'Late', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  ON_LEAVE: { label: 'On Leave', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Coffee },
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StudentAttendancePage() {
  const studentProfileId = useAuthStore((s) => s.user?.studentProfile?.id) ?? '';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', studentProfileId, month, year],
    queryFn: async () => {
      const res = await api.get(`/attendance/student/${studentProfileId}`, {
        params: { month, year, limit: 31 },
      });
      return res.data.data;
    },
    enabled: !!studentProfileId,
  });

  const attendanceRate = useMemo(() => {
    if (!data?.summary) return 0;
    const total = data.summary.present + data.summary.absent + data.summary.late + data.summary.onLeave;
    if (total === 0) return 0;
    return Math.round(((data.summary.present + data.summary.late) / total) * 100);
  }, [data]);

  if (isLoading) return <div className="space-y-4"><PageHeader title="Attendance" description="Your attendance records" /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Attendance" description="View your attendance records" />

      <div className="flex items-center gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{year}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-xl col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex justify-center">
            <ProgressRing
              value={attendanceRate}
              size={100}
              strokeWidth={8}
              color={attendanceRate >= 75 ? '#22c55e' : '#ef4444'}
              label="Attendance"
            />
          </CardContent>
        </Card>
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = data?.summary?.[key === 'ON_LEAVE' ? 'onLeave' : key.toLowerCase()] ?? 0;
          return (
            <Card key={key} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
                <p className="text-2xl font-display font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attendance Records */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            <CalendarDays className="inline h-4 w-4 mr-2" />
            Daily Records - {months[month - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.records?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attendance records for this month</p>
          ) : (
            <div className="space-y-2">
              {data.records.map((record: any) => {
                const config = statusConfig[record.status] || statusConfig.PRESENT;
                const Icon = config.icon;
                return (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium w-24">
                        {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </div>
                      <Badge variant="secondary" className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
