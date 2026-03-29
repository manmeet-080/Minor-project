'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { LayoutGrid, Table2, AlertTriangle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  student?: { user: { name: string }; rollNumber: string };
  assignedTo?: { name: string; id: string };
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
}

const priorityStyles: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusStyles: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ASSIGNED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const kanbanColors: Record<string, string> = {
  OPEN: '#ef4444',
  ASSIGNED: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#22c55e',
};

export default function ComplaintsPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [view, setView] = useState<string>('kanban');
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', hostelId],
    queryFn: async () => {
      const res = await api.get('/complaints', { params: { hostelId } });
      return res.data.data as Complaint[];
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', hostelId],
    queryFn: async () => {
      const res = await api.get('/users', { params: { hostelId, role: 'STAFF' } });
      return res.data.data as StaffMember[];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ complaintId, staffId }: { complaintId: string; staffId: string }) => {
      await api.patch(`/complaints/${complaintId}/assign`, { assignedToId: staffId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint assigned successfully');
      setDetailComplaint(null);
    },
    onError: () => toast.error('Failed to assign complaint'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: string; status: string }) => {
      await api.patch(`/complaints/${complaintId}/status`, { status, message: 'Status updated' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const kanbanColumns = useMemo(() => {
    const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const;
    return statuses.map((status) => ({
      id: status,
      title: status.replace('_', ' '),
      color: kanbanColors[status],
      items: complaints
        .filter((c) => c.status === status)
        .map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.student?.user?.name ?? c.category,
          priority: c.priority,
          assignee: c.assignedTo?.name,
        })),
    }));
  }, [complaints]);

  const handleKanbanDragEnd = (itemId: string, newColumnId: string) => {
    statusMutation.mutate({ complaintId: itemId, status: newColumnId });
  };

  const columns: ColumnDef<Complaint>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <button
            className="text-left font-medium hover:underline"
            onClick={() => {
              setDetailComplaint(row.original);
              setSelectedStaff(row.original.assignedTo?.id ?? '');
            }}
          >
            {row.original.title}
          </button>
        ),
      },
      { accessorKey: 'category', header: 'Category' },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => {
          const p = getValue<string>();
          return (
            <Badge variant="secondary" className={priorityStyles[p]}>
              {p}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return (
            <Badge variant="secondary" className={statusStyles[s]}>
              {s.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => row.original.student?.user?.name ?? '—',
      },
      {
        id: 'assignedTo',
        header: 'Assigned To',
        cell: ({ row }) => row.original.assignedTo?.name ?? '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Complaints" description="Track and manage student complaints" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Complaints"
        description={`${complaints.length} total complaints`}
      />

      <Tabs value={view} onValueChange={setView}>
        <TabsList className="rounded-lg">
          <TabsTrigger value="kanban" className="rounded-lg gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="table" className="rounded-lg gap-1.5">
            <Table2 className="h-4 w-4" />
            Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard columns={kanbanColumns} onDragEnd={handleKanbanDragEnd} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <DataTable
            columns={columns}
            data={complaints}
            searchKey="title"
            searchPlaceholder="Search complaints..."
            emptyTitle="No complaints"
            emptyDescription="There are no complaints to display."
          />
        </TabsContent>
      </Tabs>

      {/* Detail / Assign Dialog */}
      <Dialog open={!!detailComplaint} onOpenChange={(open) => !open && setDetailComplaint(null)}>
        <DialogContent className="rounded-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{detailComplaint?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">{detailComplaint?.description}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Priority</span>
                <div className="mt-1">
                  <Badge variant="secondary" className={priorityStyles[detailComplaint?.priority ?? 'LOW']}>
                    {detailComplaint?.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <Badge variant="secondary" className={statusStyles[detailComplaint?.status ?? 'OPEN']}>
                    {detailComplaint?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium mt-1">{detailComplaint?.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Student</span>
                <p className="font-medium mt-1">{detailComplaint?.student?.user?.name ?? '—'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Assign Staff</label>
              <Select value={selectedStaff} onValueChange={(v) => setSelectedStaff(v ?? '')}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailComplaint(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedStaff || assignMutation.isPending}
              onClick={() => {
                if (detailComplaint && selectedStaff) {
                  assignMutation.mutate({
                    complaintId: detailComplaint.id,
                    staffId: selectedStaff,
                  });
                }
              }}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
