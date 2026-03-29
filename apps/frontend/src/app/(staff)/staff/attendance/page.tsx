'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, Coffee, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const statusOptions = [
  { value: 'PRESENT', label: 'Present', icon: CheckCircle2, color: 'text-success' },
  { value: 'ABSENT', label: 'Absent', icon: XCircle, color: 'text-destructive' },
  { value: 'LATE', label: 'Late', icon: Clock, color: 'text-amber-500' },
  { value: 'ON_LEAVE', label: 'On Leave', icon: Coffee, color: 'text-blue-500' },
];

export default function StaffAttendancePage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('PRESENT');
  const queryClient = useQueryClient();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-attendance', hostelId],
    queryFn: async () => {
      const res = await api.get('/students', { params: { hostelId, limit: 200, status: 'APPROVED' } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

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
      toast.success('Attendance marked');
    },
    onError: () => toast.error('Failed to mark attendance'),
  });

  const bulkMarkMutation = useMutation({
    mutationFn: async () => {
      const unmarkedIds = (students || [])
        .filter((s: any) => !markedStudentIds.has(s.id))
        .map((s: any) => s.id);
      if (unmarkedIds.length === 0) {
        toast.info('All students already marked');
        return;
      }
      await api.post('/attendance/bulk', { studentIds: unmarkedIds, hostelId, date, status: selectedStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      toast.success('Bulk attendance marked');
    },
    onError: () => toast.error('Failed to mark bulk attendance'),
  });

  const markedStudentIds = new Set((dailyReport?.records || []).map((r: any) => r.studentId));

  if (studentsLoading || reportLoading) {
    return <div className="space-y-4"><PageHeader title="Mark Attendance" description="Mark daily student attendance" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Mark Attendance" description="Mark daily student attendance" />

      {/* Controls */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-4">
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
              Mark All Unmarked as {statusOptions.find(s => s.value === selectedStatus)?.label}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-display font-bold">{dailyReport?.totalStudents ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-success">Present</p>
            <p className="text-xl font-display font-bold">{dailyReport?.present ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-destructive">Absent</p>
            <p className="text-xl font-display font-bold">{dailyReport?.absent ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unmarked</p>
            <p className="text-xl font-display font-bold">{dailyReport?.unmarked ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(students || []).map((student: any) => {
              const record = (dailyReport?.records || []).find((r: any) => r.studentId === student.id);
              const isMarked = !!record;
              const statusInfo = isMarked ? statusOptions.find(s => s.value === record.status) : null;

              return (
                <div key={student.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{student.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber} - {student.department}</p>
                  </div>
                  {isMarked ? (
                    <Badge variant="secondary" className="gap-1">
                      {statusInfo && <statusInfo.icon className={`h-3 w-3 ${statusInfo.color}`} />}
                      {statusInfo?.label}
                    </Badge>
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
    </motion.div>
  );
}
