'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { DoorOpen, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SkeletonTable } from '@/components/shared/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const gatePassSchema = z
  .object({
    type: z.string().min(1, 'Please select a type'),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    destination: z.string().min(2, 'Destination is required'),
    exitDate: z.string().min(1, 'Exit date is required'),
    expectedReturn: z.string().min(1, 'Return date is required'),
  })
  .refine((data) => new Date(data.expectedReturn) >= new Date(data.exitDate), {
    message: 'Return date must be after exit date',
    path: ['expectedReturn'],
  });

type GatePassForm = z.infer<typeof gatePassSchema>;

interface GatePass {
  id: string;
  type: string;
  reason: string;
  destination: string;
  exitDate: string;
  expectedReturn: string;
  status: string;
  approvedBy?: string;
  createdAt: string;
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  Pending: { variant: 'outline', className: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:bg-yellow-950' },
  Approved: { variant: 'outline', className: 'border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950' },
  Rejected: { variant: 'outline', className: 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-950' },
  'Checked Out': { variant: 'outline', className: 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:bg-blue-950' },
  Returned: { variant: 'outline', className: 'border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-950' },
  Expired: { variant: 'outline', className: 'border-gray-300 text-gray-500 bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:bg-gray-950' },
};

const passTypes = [
  { value: 'LOCAL', label: 'Local' },
  { value: 'HOME', label: 'Home' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'MEDICAL', label: 'Medical' },
];

export default function StudentGatePassPage() {
  const user = useAuthStore((s) => s.user);
  const studentId = user?.studentProfile?.id;
  const hostelId = user?.hostelId;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: gatePasses, isLoading } = useQuery({
    queryKey: ['student-gate-passes', studentId],
    queryFn: () => api.get('/gate-passes', { params: { studentId } }).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GatePassForm>({
    resolver: zodResolver(gatePassSchema),
    defaultValues: { type: '', reason: '', destination: '', exitDate: '', expectedReturn: '' },
  });

  const createMutation = useMutation({
    mutationFn: (data: GatePassForm) =>
      api.post('/gate-passes', { ...data, studentId, hostelId }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Gate pass request submitted');
      queryClient.invalidateQueries({ queryKey: ['student-gate-passes', studentId] });
      setDialogOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Failed to submit gate pass request');
    },
  });

  const onSubmit = (data: GatePassForm) => {
    createMutation.mutate(data);
  };

  const columns = useMemo<ColumnDef<GatePass>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
      },
      {
        accessorKey: 'destination',
        header: 'Destination',
      },
      {
        accessorKey: 'exitDate',
        header: 'Exit Date',
        cell: ({ row }) => format(new Date(row.original.exitDate), 'MMM d, yyyy h:mm a'),
      },
      {
        accessorKey: 'expectedReturn',
        header: 'Return Date',
        cell: ({ row }) => format(new Date(row.original.expectedReturn), 'MMM d, yyyy h:mm a'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const cfg = statusConfig[row.original.status] ?? statusConfig.Pending;
          return (
            <Badge variant={cfg.variant} className={cfg.className}>
              {row.original.status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Requested',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
      },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Gate Pass"
        description="Request gate passes and view your history"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Request Gate Pass
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Request Gate Pass</DialogTitle>
                <DialogDescription>
                  Fill in the details for your gate pass request.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full rounded-lg">
                          <SelectValue placeholder="Select pass type" />
                        </SelectTrigger>
                        <SelectContent>
                          {passTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-xs text-destructive">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Where are you going?"
                    className="rounded-lg"
                    {...register('destination')}
                    aria-invalid={!!errors.destination}
                  />
                  {errors.destination && (
                    <p className="text-xs text-destructive">{errors.destination.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why do you need a gate pass?"
                    rows={3}
                    {...register('reason')}
                    aria-invalid={!!errors.reason}
                  />
                  {errors.reason && (
                    <p className="text-xs text-destructive">{errors.reason.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exitDate">Exit Date & Time</Label>
                    <Input
                      id="exitDate"
                      type="datetime-local"
                      className="rounded-lg"
                      {...register('exitDate')}
                      aria-invalid={!!errors.exitDate}
                    />
                    {errors.exitDate && (
                      <p className="text-xs text-destructive">{errors.exitDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedReturn">Return Date & Time</Label>
                    <Input
                      id="expectedReturn"
                      type="datetime-local"
                      className="rounded-lg"
                      {...register('expectedReturn')}
                      aria-invalid={!!errors.expectedReturn}
                    />
                    {errors.expectedReturn && (
                      <p className="text-xs text-destructive">{errors.expectedReturn.message}</p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : (
        <DataTable
          columns={columns}
          data={gatePasses ?? []}
          searchKey="destination"
          searchPlaceholder="Search by destination..."
          emptyTitle="No Gate Passes"
          emptyDescription="You haven't requested any gate passes yet."
        />
      )}
    </motion.div>
  );
}
