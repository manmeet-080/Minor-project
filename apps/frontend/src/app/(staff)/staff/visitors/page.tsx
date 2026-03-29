'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus,
  LogOut,
  RefreshCw,
  Phone,
  User,
  FileText,
  CreditCard,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  idProof?: string;
  entryTime: string;
  exitTime?: string;
  student?: { user?: { name: string }; id: string };
}

interface StudentOption {
  id: string;
  user: { name: string };
  rollNumber: string;
}

const visitorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must not exceed 15 digits')
    .regex(/^[0-9+\-\s]+$/, 'Invalid phone number'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters').max(300),
  studentId: z.string().min(1, 'Please select a student'),
  idProof: z.string().optional(),
});

type VisitorForm = z.infer<typeof visitorSchema>;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function StaffVisitorsPage() {
  const queryClient = useQueryClient();
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VisitorForm>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      name: '',
      phone: '',
      purpose: '',
      studentId: '',
      idProof: '',
    },
  });

  const selectedStudentId = watch('studentId');

  // Fetch visitors
  const { data: visitorsData, isLoading: visitorsLoading, refetch } = useQuery({
    queryKey: ['staff-visitors'],
    queryFn: async () => {
      const { data } = await api.get('/visitors');
      return data.data as Visitor[];
    },
    staleTime: 30_000,
  });

  const hostelId = useAuthStore((s) => s.user?.hostelId);

  // Fetch students for the select dropdown
  const { data: studentsData } = useQuery({
    queryKey: ['students-list', hostelId],
    queryFn: async () => {
      const { data } = await api.get('/students', { params: { hostelId } });
      return data.data as StudentOption[];
    },
    enabled: !!hostelId,
    staleTime: 60_000,
  });

  const visitors = visitorsData ?? [];
  const students = studentsData ?? [];

  // Create visitor mutation
  const createMutation = useMutation({
    mutationFn: async (payload: VisitorForm) => {
      const { data } = await api.post('/visitors', {
        visitorName: payload.name,
        visitorPhone: payload.phone,
        purpose: payload.purpose,
        studentId: payload.studentId,
        idProof: payload.idProof || undefined,
        hostelId,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Visitor entry recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-visitors'] });
      reset();
    },
    onError: () => {
      toast.error('Failed to record visitor entry');
    },
  });

  // Log exit mutation
  const exitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/visitors/${id}/exit`);
      return data;
    },
    onSuccess: () => {
      toast.success('Visitor exit logged successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-visitors'] });
      setExitConfirmOpen(false);
      setSelectedVisitorId(null);
    },
    onError: () => {
      toast.error('Failed to log visitor exit');
    },
  });

  const onSubmit = (data: VisitorForm) => {
    createMutation.mutate(data);
  };

  const handleExitClick = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setExitConfirmOpen(true);
  };

  const confirmExit = () => {
    if (selectedVisitorId) {
      exitMutation.mutate(selectedVisitorId);
    }
  };

  const columns: ColumnDef<Visitor, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Visitor Name',
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.phone}</span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        cell: ({ row }) => (
          <span className="text-sm max-w-[200px] truncate block">
            {row.original.purpose}
          </span>
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
        accessorKey: 'entryTime',
        header: 'Entry Time',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.entryTime), 'MMM d, h:mm a')}
          </span>
        ),
      },
      {
        accessorKey: 'exitTime',
        header: 'Exit Time',
        cell: ({ row }) =>
          row.original.exitTime ? (
            <span className="text-sm text-muted-foreground">
              {format(new Date(row.original.exitTime), 'MMM d, h:mm a')}
            </span>
          ) : (
            <Badge variant="outline">Still inside</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          !row.original.exitTime ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExitClick(row.original.id)}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Log Exit
            </Button>
          ) : null,
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
          title="Visitor Management"
          description="Record visitor entries and manage the visitor log."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </motion.div>

      {/* Entry Form */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Visitor Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Visitor Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Visitor Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    className="rounded-lg"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    className="rounded-lg"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Student Select */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Visiting Student
                  </Label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={(val) => setValue('studentId', val ?? '')}
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.user.name} ({student.rollNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.studentId && (
                    <p className="text-xs text-destructive">{errors.studentId.message}</p>
                  )}
                </div>

                {/* ID Proof */}
                <div className="space-y-2">
                  <Label htmlFor="idProof" className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    ID Proof
                  </Label>
                  <Input
                    id="idProof"
                    placeholder="e.g., Aadhaar, DL, Passport"
                    className="rounded-lg"
                    {...register('idProof')}
                  />
                  {errors.idProof && (
                    <p className="text-xs text-destructive">{errors.idProof.message}</p>
                  )}
                </div>

                {/* Purpose - spans 2 cols */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="purpose" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Purpose of Visit
                  </Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of the visit..."
                    className="rounded-lg min-h-[80px]"
                    {...register('purpose')}
                  />
                  {errors.purpose && (
                    <p className="text-xs text-destructive">{errors.purpose.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Recording...' : 'Record Entry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Visitor Log Table */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Visitor Log</CardTitle>
          </CardHeader>
          <CardContent>
            {visitorsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={visitors}
                searchKey="name"
                searchPlaceholder="Search visitors..."
                emptyTitle="No visitors recorded"
                emptyDescription="No visitor entries have been recorded yet."
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        open={exitConfirmOpen}
        onOpenChange={setExitConfirmOpen}
        title="Log Visitor Exit"
        description="Are you sure you want to log the exit for this visitor? This action will record the current time as the exit time."
        confirmLabel="Log Exit"
        onConfirm={confirmExit}
      />
    </motion.div>
  );
}
