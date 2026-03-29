'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Plus, Upload } from 'lucide-react';
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

const complaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  priority: z.string().min(1, 'Please select a priority'),
});

type ComplaintForm = z.infer<typeof complaintSchema>;

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  Open: { variant: 'outline', className: 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:bg-blue-950' },
  Assigned: { variant: 'outline', className: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:bg-yellow-950' },
  'In Progress': { variant: 'outline', className: 'border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950' },
  Resolved: { variant: 'outline', className: 'border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950' },
  Closed: { variant: 'outline', className: 'border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:bg-gray-950' },
};

const categories = [
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'PEST_CONTROL', label: 'Pest Control' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
];
const priorities = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export default function StudentComplaintsPage() {
  const user = useAuthStore((s) => s.user);
  const studentId = user?.studentProfile?.id;
  const hostelId = user?.hostelId;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['student-complaints', studentId],
    queryFn: () => api.get('/complaints', { params: { studentId } }).then((r) => r.data.data),
    enabled: !!studentId,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { title: '', description: '', category: '', priority: 'MEDIUM' },
  });

  const createMutation = useMutation({
    mutationFn: (data: ComplaintForm) =>
      api.post('/complaints', { ...data, studentId, hostelId }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Complaint filed successfully');
      queryClient.invalidateQueries({ queryKey: ['student-complaints', studentId] });
      setDialogOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Failed to file complaint');
    },
  });

  const onSubmit = (data: ComplaintForm) => {
    createMutation.mutate(data);
  };

  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const p = row.original.priority;
          const color =
            p === 'Urgent'
              ? 'destructive'
              : p === 'High'
              ? 'destructive'
              : 'secondary';
          return <Badge variant={color as 'default'}>{p}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const cfg = statusConfig[row.original.status] ?? statusConfig.Open;
          return (
            <Badge variant={cfg.variant} className={cfg.className}>
              {row.original.status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Filed On',
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
        title="Complaints"
        description="File and track your complaints"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  File Complaint
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">File a Complaint</DialogTitle>
                <DialogDescription>
                  Describe your issue and we will address it as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief title for your complaint"
                    className="rounded-lg"
                    {...register('title')}
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    {...register('description')}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <p className="text-xs text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.priority && (
                      <p className="text-xs text-destructive">{errors.priority.message}</p>
                    )}
                  </div>
                </div>

                {/* Image upload placeholder */}
                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Click or drag image to upload
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createMutation.isPending ? 'Filing...' : 'Submit Complaint'}
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
          data={complaints ?? []}
          searchKey="title"
          searchPlaceholder="Search complaints..."
          emptyTitle="No Complaints"
          emptyDescription="You haven't filed any complaints yet."
        />
      )}
    </motion.div>
  );
}
