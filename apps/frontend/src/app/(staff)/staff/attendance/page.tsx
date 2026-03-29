'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, Coffee, Users, CalendarDays, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const statusOptions = [
  { value: 'PRESENT', label: 'Present', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  { value: 'ABSENT', label: 'Absent', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  { value: 'LATE', label: 'Late', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { value: 'ON_LEAVE', label: 'On Leave', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

// Indian semester system
function getCurrentSemester(): { semester: 'odd' | 'even'; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  if (month >= 6) return { semester: 'odd', year: now.getFullYear() }; // Jul-Dec
  return { semester: 'even', year: now.getFullYear() }; // Jan-Jun
}

function getSemesterLabel(semester: 'odd' | 'even', year: number): string {
  return semester === 'odd' ? `Odd Semester (Jul-Dec ${year})` : `Even Semester (Jan-Jun ${year})`;
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

export default function StaffAttendancePage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';
  const current = getCurrentSemester();
  const [semester, setSemester] = useState<'odd' | 'even'>(current.semester);
  const [year, setYear] = useState(current.year);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('PRESENT');
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('PRESENT');
  const [editRemarks, setEditRemarks] = useState('');
  const queryClient = useQueryClient();

  const semesterMonths = useMemo(() => getSemesterMonths(semester), [semester]);

  // Semester summary
  const { data: semesterData } = useQuery({
    queryKey: ['semester-summary', hostelId, semester, year],
    queryFn: async () => {
      const res = await api.get(`/attendance/semester/${hostelId}`, { params: { semester, year } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  // Calendar view for selected month
  const selectedMonth = Number(date.split('-')[1]);
  const { data: calendarData } = useQuery({
    queryKey: ['attendance-calendar', hostelId, selectedMonth, year],
    queryFn: async () => {
      const res = await api.get(`/attendance/calendar/${hostelId}`, { params: { month: selectedMonth, year } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  // Students list
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-attendance', hostelId],
    queryFn: async () => {
      const res = await api.get('/students', { params: { hostelId, limit: 200, status: 'APPROVED' } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  // Daily report
  const { data: dailyReport, isLoading: reportLoading } = useQuery({
    queryKey: ['daily-attendance', hostelId, date],
    queryFn: async () => {
      const res = await api.get(`/attendance/daily/${hostelId}`, { params: { date } });
      return res.data.data;
    },
    enabled: !!hostelId && !!date,
  });

  const markMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      await api.post('/attendance', { studentId, hostelId, date, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['semester-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-calendar'] });
      toast.success('Attendance marked');
    },
    onError: () => toast.error('Failed to mark attendance'),
  });

  const bulkMarkMutation = useMutation({
    mutationFn: async () => {
      const unmarkedIds = (students || [])
        .filter((s: any) => !markedStudentIds.has(s.id))
        .map((s: any) => s.id);
      if (unmarkedIds.length === 0) { toast.info('All students already marked'); return; }
      await api.post('/attendance/bulk', { studentIds: unmarkedIds, hostelId, date, status: selectedStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['semester-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-calendar'] });
      toast.success('Bulk attendance marked');
    },
    onError: () => toast.error('Failed to mark bulk attendance'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/attendance/${editRecord.id}`, { status: editStatus, remarks: editRemarks || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['semester-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-calendar'] });
      setEditRecord(null);
      toast.success('Attendance updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const markedStudentIds = new Set((dailyReport?.records || []).map((r: any) => r.studentId));

  if (studentsLoading || reportLoading) {
    return <div className="space-y-4"><PageHeader title="Attendance" description="Semester-wise attendance management" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Attendance Management" description="Mark and manage student attendance per Indian academic semester" />

      {/* Semester Selector */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
                <SelectTrigger className="w-28 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => v && setSemester(v as 'odd' | 'even')}>
                <SelectTrigger className="w-52 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="odd">Odd Semester (Jul - Dec)</SelectItem>
                  <SelectItem value="even">Even Semester (Jan - Jun)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Default Status</Label>
              <Select value={selectedStatus} onValueChange={(v) => v && setSelectedStatus(v)}>
                <SelectTrigger className="w-36 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => bulkMarkMutation.mutate()} disabled={bulkMarkMutation.isPending}>
              <Users className="h-4 w-4 mr-2" />
              Mark All Unmarked
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Semester Summary */}
      {semesterData && (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">{getSemesterLabel(semester, year)}</CardTitle>
            <CardDescription>Working days: {semesterData.workingDays} | Students: {semesterData.totalStudents}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <ProgressRing
                value={semesterData.attendanceRate}
                size={90}
                strokeWidth={8}
                color={semesterData.attendanceRate >= 75 ? '#22c55e' : '#ef4444'}
                label="Rate"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {[
                  { label: 'Present', value: semesterData.present, color: 'text-success' },
                  { label: 'Absent', value: semesterData.absent, color: 'text-destructive' },
                  { label: 'Late', value: semesterData.late, color: 'text-amber-500' },
                  { label: 'On Leave', value: semesterData.onLeave, color: 'text-blue-500' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={`text-xs ${s.color}`}>{s.label}</p>
                    <p className="text-lg font-display font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Calendar Heatmap */}
      {calendarData?.calendar && (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              <CalendarDays className="inline h-4 w-4 mr-2" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-muted-foreground font-medium py-1">{d}</div>
              ))}
              {(() => {
                const firstDay = new Date(calendarData.year, calendarData.month - 1, 1).getDay();
                const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
                const cells = [];
                for (let i = 0; i < offset; i++) cells.push(<div key={`empty-${i}`} />);
                const entries = Object.entries(calendarData.calendar as Record<string, any>);
                for (const [dateKey, stats] of entries) {
                  const day = Number(dateKey.split('-')[2]);
                  const dayOfWeek = new Date(dateKey).getDay();
                  const isSunday = dayOfWeek === 0;
                  const hasData = stats.total > 0;
                  const rate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
                  const bg = isSunday ? 'bg-muted/30 text-muted-foreground/50' :
                    !hasData ? 'bg-muted/50 text-muted-foreground' :
                    rate >= 90 ? 'bg-success/20 text-success' :
                    rate >= 75 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                    'bg-destructive/20 text-destructive';

                  cells.push(
                    <div
                      key={dateKey}
                      className={`rounded-lg p-1.5 text-center cursor-default ${bg}`}
                      title={isSunday ? 'Sunday (Holiday)' : `${dateKey}: P:${stats.present} A:${stats.absent} L:${stats.late} OL:${stats.onLeave}`}
                      onClick={() => !isSunday && setDate(dateKey)}
                    >
                      <div className="font-medium">{day}</div>
                      {hasData && !isSunday && <div className="text-[9px]">{rate}%</div>}
                      {isSunday && <div className="text-[9px]">Off</div>}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
            <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
              <span><span className="inline-block w-3 h-3 rounded bg-success/20 mr-1" />90%+</span>
              <span><span className="inline-block w-3 h-3 rounded bg-amber-500/20 mr-1" />75-89%</span>
              <span><span className="inline-block w-3 h-3 rounded bg-destructive/20 mr-1" />&lt;75%</span>
              <span><span className="inline-block w-3 h-3 rounded bg-muted/50 mr-1" />No data</span>
              <span><span className="inline-block w-3 h-3 rounded bg-muted/30 mr-1" />Holiday</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Daily Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: dailyReport?.totalStudents ?? 0, color: '' },
          { label: 'Present', value: dailyReport?.present ?? 0, color: 'text-success' },
          { label: 'Absent', value: dailyReport?.absent ?? 0, color: 'text-destructive' },
          { label: 'Late', value: dailyReport?.late ?? 0, color: 'text-amber-500' },
          { label: 'Unmarked', value: dailyReport?.unmarked ?? 0, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-3">
              <p className={`text-xs ${s.color || 'text-muted-foreground'}`}>{s.label}</p>
              <p className="text-xl font-display font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student List — Mark or Update */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">
            Students — {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {(students || []).map((student: any) => {
              const record = (dailyReport?.records || []).find((r: any) => r.studentId === student.id);
              const isMarked = !!record;
              const statusInfo = isMarked ? statusOptions.find((s) => s.value === record.status) : null;

              return (
                <div key={student.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{student.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber} — {student.department}, Year {student.year}</p>
                  </div>
                  {isMarked ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`gap-1 ${statusInfo?.bg}`}>
                        {statusInfo && <statusInfo.icon className={`h-3 w-3 ${statusInfo.color}`} />}
                        {statusInfo?.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Edit attendance"
                        onClick={() => {
                          setEditRecord(record);
                          setEditStatus(record.status);
                          setEditRemarks(record.remarks || '');
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {statusOptions.map((s) => {
                        const Icon = s.icon;
                        return (
                          <Button
                            key={s.value}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title={s.label}
                            onClick={() => markMutation.mutate({ studentId: student.id, status: s.value })}
                            disabled={markMutation.isPending}
                          >
                            <Icon className={`h-4 w-4 ${s.color}`} />
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Update Attendance</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {(students || []).find((s: any) => s.id === editRecord.studentId)?.user?.name} — {new Date(editRecord.date).toLocaleDateString('en-IN')}
              </p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => v && setEditStatus(v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Remarks (optional)</Label>
                <Input className="rounded-lg" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} placeholder="Reason for change..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
