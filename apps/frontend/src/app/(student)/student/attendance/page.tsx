'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, XCircle, Clock, Coffee, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

// Indian semester system
function getCurrentSemester(): { semester: 'odd' | 'even'; year: number } {
  const now = new Date();
  return now.getMonth() >= 6 ? { semester: 'odd', year: now.getFullYear() } : { semester: 'even', year: now.getFullYear() };
}

function getSemesterMonths(semester: 'odd' | 'even'): { value: number; label: string }[] {
  if (semester === 'odd') {
    return [
      { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
      { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];
  }
  return [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  ];
}

export default function StudentAttendancePage() {
  const studentProfileId = useAuthStore((s) => s.user?.studentProfile?.id) ?? '';
  const current = getCurrentSemester();
  const now = new Date();
  const [semester, setSemester] = useState<'odd' | 'even'>(current.semester);
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(now.getMonth() + 1);

  const semesterMonths = useMemo(() => getSemesterMonths(semester), [semester]);

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
      <PageHeader title="My Attendance" description="View your semester-wise attendance records" />

      {/* Semester & Month Selector */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
                <SelectTrigger className="w-24 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => { if (v) { setSemester(v as any); setMonth(v === 'odd' ? 7 : 1); } }}>
                <SelectTrigger className="w-52 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="odd">Odd Semester (Jul - Dec)</SelectItem>
                  <SelectItem value="even">Even Semester (Jan - Jun)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={String(month)} onValueChange={(v) => v && setMonth(Number(v))}>
                <SelectTrigger className="w-36 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {semesterMonths.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Warning */}
      {attendanceRate > 0 && attendanceRate < 75 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Low Attendance Warning</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your attendance is below 75%. As per university regulations, minimum 75% attendance is required to be eligible for end-semester examinations.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-xl col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex justify-center">
            <ProgressRing
              value={attendanceRate}
              size={100}
              strokeWidth={8}
              color={attendanceRate >= 75 ? '#22c55e' : '#ef4444'}
              label="This Month"
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

      {/* Daily Records */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            <CalendarDays className="inline h-4 w-4 mr-2" />
            {semesterMonths.find((m) => m.value === month)?.label} {year}
          </CardTitle>
          <CardDescription>
            {semester === 'odd' ? 'Odd' : 'Even'} Semester {year} — {data?.meta?.total ?? 0} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.records?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attendance records for this month</p>
          ) : (
            <div className="space-y-1.5">
              {data.records.map((record: any) => {
                const config = statusConfig[record.status] || statusConfig.PRESENT;
                const Icon = config.icon;
                const dateObj = new Date(record.date);
                const isSunday = dateObj.getDay() === 0;

                return (
                  <div key={record.id} className={`flex items-center justify-between py-2 px-2 rounded-lg border-b border-border last:border-0 ${isSunday ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium w-28">
                        {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </div>
                      <Badge variant="secondary" className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {record.remarks && (
                        <span className="text-xs text-muted-foreground italic">{record.remarks}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {record.markedBy?.name && <span>by {record.markedBy.name}</span>}
                      <span>
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
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
