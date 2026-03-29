'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  BedDouble,
  Receipt,
  AlertTriangle,
  Clock,
  UserPlus,
  CreditCard,
  BarChart3,
  Megaphone,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { GettingStarted } from '@/components/shared/GettingStarted';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { AreaChartWrapper } from '@/components/charts/AreaChart';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { OccupancyGrid } from '@/components/admin/OccupancyGrid';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/* ── animation variants ────────────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 } as const,
  show: { opacity: 1, transition: { staggerChildren: 0.07 } } as const,
};

const item = {
  hidden: { opacity: 0, y: 16 } as const,
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

/* ── variant styles for stat cards ─────────────────────────────────── */

const variantStyles: Record<string, { icon: string; ring: string }> = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    ring: 'ring-primary/10',
  },
  success: {
    icon: 'bg-success/10 text-success',
    ring: 'ring-success/10',
  },
  accent: {
    icon: 'bg-accent/20 text-accent-foreground',
    ring: 'ring-accent/10',
  },
  danger: {
    icon: 'bg-destructive/10 text-destructive',
    ring: 'ring-destructive/10',
  },
};

/* ── stat card with animated number ────────────────────────────────── */

interface AnimatedStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  variant: 'primary' | 'success' | 'accent' | 'danger';
  trend?: { value: number; positive: boolean };
  formatFn?: (n: number) => string;
}

function AnimatedStatCard({
  title,
  value,
  prefix,
  suffix,
  icon: Icon,
  variant,
  trend,
  formatFn,
}: AnimatedStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className="rounded-xl ring-1 ring-transparent hover:ring-1 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold">
              {prefix}
              <AnimatedNumber value={value} formatFn={formatFn} />
              {suffix}
            </p>
            {trend && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
                  trend.positive
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive',
                )}
              >
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.positive ? '+' : ''}
                {trend.value}% from last month
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── quick action button ───────────────────────────────────────────── */

interface QuickActionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

function QuickAction({ label, description, icon: Icon, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="rounded-xl group hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold group-hover:text-primary transition-colors">
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}

/* ── relative time helper ──────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── activity type icon mapping ────────────────────────────────────── */

const activityIcons: Record<string, LucideIcon> = {
  payment: CreditCard,
  complaint: AlertTriangle,
  student: Users,
  room: BedDouble,
  fee: Receipt,
};

/* ── quick actions config ──────────────────────────────────────────── */

const quickActions: QuickActionProps[] = [
  {
    label: 'Add Student',
    description: 'Register a new student',
    icon: UserPlus,
    href: '/admin/students',
  },
  {
    label: 'Record Payment',
    description: 'Log a fee payment',
    icon: CreditCard,
    href: '/admin/fees',
  },
  {
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: BarChart3,
    href: '/admin/reports',
  },
  {
    label: 'Broadcast Notice',
    description: 'Send announcement',
    icon: Megaphone,
    href: '/admin/settings',
  },
];

/* ── loading skeleton ──────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of hostel operations" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── main dashboard page ───────────────────────────────────────────── */

export default function DashboardPage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';

  /* ── data fetching ─────────────────────────────────────────────── */

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard', hostelId],
    queryFn: async () => {
      const res = await api.get(`/reports/dashboard/${hostelId}`);
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  const { data: revenueTrend, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-trend', hostelId],
    queryFn: async () => {
      const res = await api.get(`/reports/revenue-trend/${hostelId}`);
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', hostelId],
    queryFn: async () => {
      const res = await api.get('/rooms', { params: { hostelId } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  /* ── derived data ──────────────────────────────────────────────── */

  const stats = useMemo(() => {
    if (!dashboard) return null;
    return {
      totalStudents: dashboard.totalStudents ?? 0,
      occupancyRate: dashboard.occupancyRate ?? 0,
      revenue: dashboard.revenue ?? 0,
      openComplaints: dashboard.openComplaints ?? 0,
      trends: dashboard.trends ?? {
        students: { value: 5, positive: true },
        occupancy: { value: 2, positive: true },
        revenue: { value: 12, positive: true },
        complaints: { value: 3, positive: false },
      },
    };
  }, [dashboard]);

  const funnelData = useMemo(() => {
    if (!dashboard?.complaintBreakdown) return [];
    const bd = dashboard.complaintBreakdown;
    return [
      { label: 'Open', value: bd.open ?? 0, color: '#ef4444' },
      { label: 'Assigned', value: bd.assigned ?? 0, color: '#f59e0b' },
      { label: 'In Progress', value: bd.inProgress ?? 0, color: '#3b82f6' },
      { label: 'Resolved', value: bd.resolved ?? 0, color: '#22c55e' },
    ];
  }, [dashboard]);

  const recentActivity: {
    id: string;
    type: string;
    message: string;
    userName?: string;
    createdAt: string;
  }[] = useMemo(() => {
    return (dashboard?.recentActivity ?? []).slice(0, 5);
  }, [dashboard]);

  /* ── loading state ─────────────────────────────────────────────── */

  if (dashLoading) {
    return <DashboardSkeleton />;
  }

  /* ── render ────────────────────────────────────────────────────── */

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item}>
        <PageHeader title="Dashboard" description="Overview of hostel operations" />
      </motion.div>

      {/* Getting Started Checklist */}
      <motion.div variants={item}>
        <GettingStarted role="admin" />
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <AnimatedStatCard
            title="Total Students"
            value={stats?.totalStudents ?? 0}
            icon={Users}
            variant="primary"
            trend={stats?.trends?.students}
          />
        </motion.div>
        <motion.div variants={item}>
          <AnimatedStatCard
            title="Occupancy Rate"
            value={stats?.occupancyRate ?? 0}
            suffix="%"
            icon={BedDouble}
            variant="success"
            trend={stats?.trends?.occupancy}
          />
        </motion.div>
        <motion.div variants={item}>
          <AnimatedStatCard
            title="Monthly Revenue"
            value={stats?.revenue ?? 0}
            prefix="₹"
            icon={Receipt}
            variant="accent"
            trend={stats?.trends?.revenue}
            formatFn={(n) => n.toLocaleString('en-IN')}
          />
        </motion.div>
        <motion.div variants={item}>
          <AnimatedStatCard
            title="Open Complaints"
            value={stats?.openComplaints ?? 0}
            icon={AlertTriangle}
            variant="danger"
            trend={stats?.trends?.complaints}
          />
        </motion.div>
      </div>

      {/* Revenue Chart + Complaint Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item}>
          {revenueLoading ? (
            <Card className="rounded-xl">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : (
            <AreaChartWrapper
              title="Revenue Trend (6 months)"
              data={revenueTrend ?? []}
              xKey="month"
              yKeys={[
                { key: 'collected', color: '#22c55e', label: 'Collected' },
                { key: 'charged', color: '#3b82f6', label: 'Charged' },
              ]}
            />
          )}
        </motion.div>
        <motion.div variants={item}>
          <FunnelChart title="Complaint Funnel" data={funnelData} />
        </motion.div>
      </div>

      {/* Occupancy Grid */}
      <motion.div variants={item}>
        {roomsLoading ? (
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <OccupancyGrid rooms={rooms ?? []} />
        )}
      </motion.div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <motion.div variants={item}>
          <div className="space-y-3">
            <h3 className="font-display text-base font-semibold px-1">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div variants={item}>
          <Card className="rounded-xl h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Recent Activity</CardTitle>
                <Link
                  href="/admin/reports"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent activity
                </p>
              ) : (
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                  {recentActivity.map((act, i) => {
                    const ActivityIcon = activityIcons[act.type] ?? Clock;
                    return (
                      <div
                        key={act.id ?? i}
                        className="relative flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="relative z-10 mt-0.5 rounded-full bg-muted border border-border p-1.5">
                          <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm leading-snug">{act.message}</p>
                          <div className="flex items-center gap-2">
                            {act.userName && (
                              <span className="text-xs font-medium text-foreground/70">
                                {act.userName}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(act.createdAt)}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {act.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
