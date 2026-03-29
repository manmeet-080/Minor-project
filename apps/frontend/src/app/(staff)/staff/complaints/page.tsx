'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  student?: { user?: { name: string } };
}

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOW: 'secondary',
  MEDIUM: 'outline',
  HIGH: 'default',
  URGENT: 'destructive',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  IN_PROGRESS: 'default',
  RESOLVED: 'secondary',
  REJECTED: 'destructive',
};

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;

const statusUpdateSchema = z.object({
  status: z.enum(STATUS_OPTIONS),
  message: z.string().min(1, 'Please provide a message').max(500),
});

type StatusUpdateForm = z.infer<typeof statusUpdateSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function StaffComplaintsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StatusUpdateForm>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: 'PENDING', message: '' },
  });

  const currentStatus = watch('status');

  const { data: complaintsData, isLoading, refetch } = useQuery({
    queryKey: ['staff-complaints', user?.id],
    queryFn: async () => {
      const { data } = await api.get('/complaints', {
        params: { assignedToId: user?.id },
      });
      return data.data as Complaint[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const complaints = complaintsData ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: StatusUpdateForm }) => {
      const { data } = await api.patch(`/complaints/${id}/status`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Complaint status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-complaints'] });
      setDialogOpen(false);
      setSelectedComplaint(null);
      reset();
    },
    onError: () => {
      toast.error('Failed to update complaint status');
    },
  });

  const openStatusDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setValue('status', complaint.status);
    setValue('message', '');
    setDialogOpen(true);
  };

  const onSubmit = (data: StatusUpdateForm) => {
    if (!selectedComplaint) return;
    updateMutation.mutate({ id: selectedComplaint.id, payload: data });
  };

  const columns: ColumnDef<Complaint, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground capitalize">
            {row.original.category.toLowerCase().replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <Badge variant={priorityVariant[row.original.priority]}>
            {row.original.priority}
          </Badge>
        ),
      },
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.student?.user?.name ?? 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openStatusDialog(row.original)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Update
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <PageHeader
          title="Assigned Complaints"
          description="View and update the status of complaints assigned to you."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={item}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={complaints}
            searchKey="title"
            searchPlaceholder="Search complaints..."
            emptyTitle="No complaints assigned"
            emptyDescription="You have no complaints assigned to you at the moment."
          />
        )}
      </motion.div>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Update Complaint Status</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(val) => { if (val) setValue('status', val as StatusUpdateForm['status']); }}
              >
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Provide details about the status update..."
                className="rounded-lg min-h-[100px]"
                {...register('message')}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
