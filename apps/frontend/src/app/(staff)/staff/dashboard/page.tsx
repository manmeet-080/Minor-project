'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ClipboardList,
  CheckCircle2,
  Users,
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
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

  const { data: visitorsData, isLoading: visitorsLoading } = useQuery({
    queryKey: ['staff-visitors-today', today, user?.hostelId],
    queryFn: async () => {
      const { data } = await api.get('/visitors', {
        params: { date: today, hostelId: user?.hostelId },
      });
      return data.data as Visitor[];
    },
    enabled: !!user?.hostelId,
    staleTime: 30_000,
  });

  const complaints = complaintsData ?? [];
  const visitors = visitorsData ?? [];

  const stats = useMemo(() => {
    const assigned = complaints.length;
    const resolvedToday = complaints.filter(
      (c) =>
        c.status === 'RESOLVED' &&
        format(new Date(c.createdAt), 'yyyy-MM-dd') === today
    ).length;
    const pendingVisitors = visitors.filter((v) => !v.exitTime).length;
    return { assigned, resolvedToday, pendingVisitors };
  }, [complaints, visitors, today]);

  const recentComplaints = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [complaints]
  );

  const isLoading = complaintsLoading || visitorsLoading;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <PageHeader
          title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Staff'}`}
          description="Here is an overview of your assigned tasks and today's activity."
        />
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Assigned Tasks"
              value={stats.assigned}
              icon={ClipboardList}
              variant="primary"
              subtitle={`${complaints.filter((c) => c.status === 'IN_PROGRESS').length} in progress`}
            />
            <StatCard
              title="Resolved Today"
              value={stats.resolvedToday}
              icon={CheckCircle2}
              variant="success"
              subtitle="Complaints resolved today"
            />
            <StatCard
              title="Pending Visitors"
              value={stats.pendingVisitors}
              icon={Users}
              variant="accent"
              subtitle={`${visitors.length} total visitors today`}
            />
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <Button
              className="w-full justify-between"
              variant="outline"
              onClick={() => router.push('/staff/complaints')}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                View All Complaints
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5">
            <Button
              className="w-full justify-between"
              variant="outline"
              onClick={() => router.push('/staff/visitors')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Visitors
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Assigned Complaints */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Recent Assigned Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : recentComplaints.length === 0 ? (
              <EmptyState
                title="No complaints assigned"
                description="You have no complaints assigned to you at the moment."
              />
            ) : (
              <div className="space-y-2">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push('/staff/complaints')}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{complaint.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
                        {complaint.student?.user?.name && (
                          <span>- {complaint.student.user.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={priorityVariant[complaint.priority]}>
                        {complaint.priority}
                      </Badge>
                      <Badge variant={statusVariant[complaint.status]}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
