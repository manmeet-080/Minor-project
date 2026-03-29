'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Users, LogIn, LogOut, CalendarDays } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  student?: { user?: { name: string }; id: string };
  loggedBy?: { name: string };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AdminVisitorsPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [dateFilter, setDateFilter] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['admin-visitors', hostelId, dateFilter],
    queryFn: async () => {
      const res = await api.get('/visitors', {
        params: { hostelId, date: dateFilter },
      });
      return res.data.data as Visitor[];
    },
  });

  // Fetch monthly total
  const { data: monthlyVisitors = [] } = useQuery({
    queryKey: ['admin-visitors-month', hostelId],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const res = await api.get('/visitors', {
        params: { hostelId, date: monthStart },
      });
      return res.data.data as Visitor[];
    },
  });

  const exitMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/visitors/${id}/exit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-visitors-month'] });
      toast.success('Visitor exit logged successfully');
      setExitConfirmOpen(false);
      setSelectedVisitorId(null);
    },
    onError: () => toast.error('Failed to log visitor exit'),
  });

  const handleExitClick = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setExitConfirmOpen(true);
  };

  const confirmExit = () => {
    if (selectedVisitorId) {
      exitMutation.mutate(selectedVisitorId);
    }
  };

  const stats = useMemo(() => {
    const todaysVisitors = visitors.length;
    const currentlyInside = visitors.filter((v) => !v.exitTime).length;
    const totalThisMonth = monthlyVisitors.length;
    return { todaysVisitors, currentlyInside, totalThisMonth };
  }, [visitors, monthlyVisitors]);

  const columns: ColumnDef<Visitor>[] = useMemo(
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
        header: 'Student Visited',
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
            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950">
              Still inside
            </Badge>
          ),
      },
      {
        id: 'loggedBy',
        header: 'Logged By',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.loggedBy?.name ?? '---'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) =>
          !row.original.exitTime ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExitClick(row.original.id)}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Log Exit
            </Button>
          ) : null,
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Visitors" />
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
          title="Visitors"
          description="Manage and monitor visitor activity"
        />
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.todaysVisitors}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Inside
            </CardTitle>
            <LogIn className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.currentlyInside}</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total This Month
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.totalThisMonth}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Date Filter */}
      <motion.div variants={item} className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Filter by date:</label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto rounded-lg"
        />
      </motion.div>

      {/* Data Table */}
      <motion.div variants={item}>
        <DataTable
          columns={columns}
          data={visitors}
          searchKey="name"
          searchPlaceholder="Search visitors..."
          emptyTitle="No visitors"
          emptyDescription="No visitor records found for the selected date."
        />
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
