'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

interface Student {
  id: string;
  user: { name: string };
  rollNumber: string;
  department: string;
  year: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EVICTED';
  bed?: { room?: { roomNumber: string } };
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EVICTED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    studentId: string;
    action: 'APPROVED' | 'REJECTED';
  }>({ open: false, studentId: '', action: 'APPROVED' });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', hostelId],
    queryFn: async () => {
      const res = await api.get('/students', { params: { hostelId } });
      return res.data.data as Student[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      if (status === 'APPROVED') {
        await api.post(`/students/${studentId}/approve`);
      } else {
        await api.post(`/students/${studentId}/reject`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update student status');
    },
  });

  const filteredStudents = useMemo(() => {
    if (statusFilter === 'ALL') return students;
    return students.filter((s) => s.status === statusFilter);
  }, [students, statusFilter]);

  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      {
        accessorKey: 'user.name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user?.name ?? '—'}</span>
        ),
      },
      { accessorKey: 'rollNumber', header: 'Roll Number' },
      { accessorKey: 'department', header: 'Department' },
      {
        accessorKey: 'year',
        header: 'Year',
        cell: ({ getValue }) => `Year ${getValue<number>()}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge variant="secondary" className={statusStyles[status]}>
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'room',
        header: 'Room',
        cell: ({ row }) => row.original.bed?.room?.roomNumber ?? '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const student = row.original;
          if (student.status !== 'PENDING') return null;
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() =>
                  setConfirmDialog({ open: true, studentId: student.id, action: 'APPROVED' })
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() =>
                  setConfirmDialog({ open: true, studentId: student.id, action: 'REJECTED' })
                }
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Students" description="Manage student registrations and room assignments" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student registrations and room assignments"
        action={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EVICTED">Evicted</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <DataTable
        columns={columns}
        data={filteredStudents}
        searchKey="name"
        searchPlaceholder="Search students..."
        emptyTitle="No students found"
        emptyDescription="No students match the current filters."
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.action === 'APPROVED' ? 'Approve Student' : 'Reject Student'}
        description={
          confirmDialog.action === 'APPROVED'
            ? 'Are you sure you want to approve this student? They will be eligible for room assignment.'
            : 'Are you sure you want to reject this student? This action can be reversed later.'
        }
        confirmLabel={confirmDialog.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={confirmDialog.action === 'REJECTED' ? 'destructive' : 'default'}
        onConfirm={() => {
          mutation.mutate({
            studentId: confirmDialog.studentId,
            status: confirmDialog.action,
          });
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
      />
    </motion.div>
  );
}
