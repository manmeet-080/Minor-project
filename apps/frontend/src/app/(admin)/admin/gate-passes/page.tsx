'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { format, isToday } from 'date-fns';
import { toast } from 'sonner';
import {
  ClipboardList, Clock, LogOut, RotateCcw, Check, X,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface GatePass {
  id: string;
  type: string;
  reason: string;
  destination: string;
  exitDate: string;
  expectedReturn: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_OUT' | 'RETURNED';
  remarks?: string;
  student?: { user: { name: string }; rollNumber: string };
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CHECKED_OUT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RETURNED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const typeStyles: Record<string, string> = {
  LOCAL: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  HOME: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  EMERGENCY: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MEDICAL: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AdminGatePassesPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'checkout' | 'return';
    passId: string;
  } | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPassId, setRejectPassId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  const { data: gatePasses = [], isLoading } = useQuery({
    queryKey: ['admin-gate-passes', hostelId],
    queryFn: async () => {
      const res = await api.get('/gate-passes', { params: { hostelId } });
      return res.data.data as GatePass[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) => {
      await api.patch(`/gate-passes/${id}/approve`, { remarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gate-passes'] });
      toast.success('Gate pass approved');
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to approve gate pass'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      await api.patch(`/gate-passes/${id}/reject`, { remarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gate-passes'] });
      toast.success('Gate pass rejected');
      setRejectDialogOpen(false);
      setRejectPassId(null);
      setRemarks('');
    },
    onError: () => toast.error('Failed to reject gate pass'),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/gate-passes/${id}/checkout`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gate-passes'] });
      toast.success('Marked as checked out');
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to mark as checked out'),
  });

  const returnMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/gate-passes/${id}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gate-passes'] });
      toast.success('Marked as returned');
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to mark as returned'),
  });

  const filteredPasses = useMemo(() => {
    if (statusFilter === 'ALL') return gatePasses;
    return gatePasses.filter((p) => p.status === statusFilter);
  }, [gatePasses, statusFilter]);

  const stats = useMemo(() => {
    const total = gatePasses.length;
    const pending = gatePasses.filter((p) => p.status === 'PENDING').length;
    const currentlyOut = gatePasses.filter((p) => p.status === 'CHECKED_OUT').length;
    const returnedToday = gatePasses.filter(
      (p) => p.status === 'RETURNED' && isToday(new Date(p.createdAt)),
    ).length;
    return { total, pending, currentlyOut, returnedToday };
  }, [gatePasses]);

  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'approve':
        approveMutation.mutate({ id: confirmAction.passId });
        break;
      case 'checkout':
        checkoutMutation.mutate(confirmAction.passId);
        break;
      case 'return':
        returnMutation.mutate(confirmAction.passId);
        break;
    }
  };

  const handleRejectSubmit = () => {
    if (rejectPassId && remarks.trim()) {
      rejectMutation.mutate({ id: rejectPassId, remarks: remarks.trim() });
    }
  };

  const columns: ColumnDef<GatePass>[] = useMemo(
    () => [
      {
        id: 'studentName',
        header: 'Student Name',
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {row.original.student?.user?.name ?? '---'}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="secondary" className={typeStyles[row.original.type] ?? ''}>
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-sm max-w-[180px] truncate block">
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.destination}</span>
        ),
      },
      {
        accessorKey: 'exitDate',
        header: 'Exit Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.exitDate), 'MMM d, yyyy h:mm a')}
          </span>
        ),
      },
      {
        accessorKey: 'expectedReturn',
        header: 'Expected Return',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.expectedReturn), 'MMM d, yyyy h:mm a')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="secondary" className={statusStyles[row.original.status]}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const pass = row.original;
          return (
            <div className="flex items-center gap-1.5">
              {pass.status === 'PENDING' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                    onClick={() =>
                      setConfirmAction({ type: 'approve', passId: pass.id })
                    }
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                    onClick={() => {
                      setRejectPassId(pass.id);
                      setRejectDialogOpen(true);
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              {pass.status === 'APPROVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConfirmAction({ type: 'checkout', passId: pass.id })
                  }
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Mark Checked Out
                </Button>
              )}
              {pass.status === 'CHECKED_OUT' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setConfirmAction({ type: 'return', passId: pass.id })
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Mark Returned
                </Button>
              )}
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
        <PageHeader title="Gate Passes" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <PageHeader
          title="Gate Passes"
          description={`${gatePasses.length} total requests`}
        />
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Out
            </CardTitle>
            <LogOut className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.currentlyOut}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Returned Today
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.returnedToday}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item}>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="rounded-lg">
            <TabsTrigger value="ALL" className="rounded-lg">All</TabsTrigger>
            <TabsTrigger value="PENDING" className="rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="APPROVED" className="rounded-lg">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED" className="rounded-lg">Rejected</TabsTrigger>
            <TabsTrigger value="CHECKED_OUT" className="rounded-lg">Checked Out</TabsTrigger>
            <TabsTrigger value="RETURNED" className="rounded-lg">Returned</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={item}>
        <DataTable
          columns={columns}
          data={filteredPasses}
          searchKey="destination"
          searchPlaceholder="Search by destination..."
          emptyTitle="No gate passes"
          emptyDescription="No gate pass requests match the current filter."
        />
      </motion.div>

      {/* Approve / Checkout / Return Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'approve'
            ? 'Approve Gate Pass'
            : confirmAction?.type === 'checkout'
              ? 'Mark as Checked Out'
              : 'Mark as Returned'
        }
        description={
          confirmAction?.type === 'approve'
            ? 'Are you sure you want to approve this gate pass request?'
            : confirmAction?.type === 'checkout'
              ? 'Confirm that the student has checked out of the hostel.'
              : 'Confirm that the student has returned to the hostel.'
        }
        confirmLabel={
          confirmAction?.type === 'approve'
            ? 'Approve'
            : confirmAction?.type === 'checkout'
              ? 'Mark Checked Out'
              : 'Mark Returned'
        }
        onConfirm={handleConfirm}
      />

      {/* Reject Dialog with remarks */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRejectDialogOpen(false);
          setRejectPassId(null);
          setRemarks('');
        }
      }}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reject Gate Pass</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-remarks">Reason for rejection</Label>
            <Textarea
              id="reject-remarks"
              placeholder="Enter the reason for rejecting this gate pass..."
              className="rounded-lg min-h-[80px]"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectPassId(null);
                setRemarks('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!remarks.trim() || rejectMutation.isPending}
              onClick={handleRejectSubmit}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
