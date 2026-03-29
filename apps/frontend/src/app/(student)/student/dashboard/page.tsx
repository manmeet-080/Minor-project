'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  AlertTriangle,
  UtensilsCrossed,
  Bell,
  Coffee,
  Soup,
  Cookie,
  MoonStar,
  ArrowRight,
  FileWarning,
  CalendarCheck,
  DoorOpen,
  Receipt,
  Info,
  CheckCircle2,
  AlertCircle,
  Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { GettingStarted } from '@/components/shared/GettingStarted';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name?: string): string {
  if (!name) return 'S';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const mealMeta: Record<string, { icon: React.ElementType; timeRange: string; startHour: number; endHour: number }> = {
  breakfast: { icon: Coffee, timeRange: '7:30 - 9:30 AM', startHour: 7, endHour: 10 },
  lunch: { icon: Soup, timeRange: '12:00 - 2:00 PM', startHour: 12, endHour: 14 },
  snacks: { icon: Cookie, timeRange: '4:30 - 5:30 PM', startHour: 16, endHour: 18 },
  dinner: { icon: MoonStar, timeRange: '7:30 - 9:30 PM', startHour: 19, endHour: 22 },
};

const mealSlots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;

const notificationIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  announcement: Megaphone,
};

const quickActions = [
  { label: 'File Complaint', href: '/student/complaints', icon: FileWarning, color: 'text-orange-500 bg-orange-500/10' },
  { label: 'Book Meal', href: '/student/mess', icon: CalendarCheck, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Request Gate Pass', href: '/student/gate-pass', icon: DoorOpen, color: 'text-blue-500 bg-blue-500/10' },
  { label: 'View Fees', href: '/student/fees', icon: Receipt, color: 'text-violet-500 bg-violet-500/10' },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 } as const,
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const studentProfile = user?.studentProfile;
  const roomNumber = studentProfile?.bed?.room?.roomNumber;
  const bedNumber = studentProfile?.bed?.bedNumber;
  const blockName = studentProfile?.bed?.room?.block?.name;
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  /* ---- Queries ---- */

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['student-balance', studentProfile?.id],
    queryFn: () => api.get(`/fees/student/${studentProfile?.id}/balance`).then((r) => r.data.data),
    enabled: !!studentProfile?.id,
  });

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['student-complaints', studentProfile?.id],
    queryFn: () => api.get('/complaints', { params: { studentId: studentProfile?.id } }).then((r) => r.data.data),
    enabled: !!studentProfile?.id,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['mess-menu-today', user?.hostelId],
    queryFn: () => api.get(`/mess/menu/${user?.hostelId}`).then((r) => r.data.data),
    enabled: !!user?.hostelId,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
  });

  /* ---- Derived data ---- */

  const openComplaints = useMemo(
    () =>
      complaintsData?.filter(
        (c: { status: string }) => c.status !== 'Resolved' && c.status !== 'Closed',
      )?.length ?? 0,
    [complaintsData],
  );

  const todayMenu = useMemo(
    () =>
      menuData?.find((m: { date: string }) => {
        const menuDate = new Date(m.date).toDateString();
        return menuDate === new Date().toDateString();
      }),
    [menuData],
  );

  const currentHour = new Date().getHours();
  const activeMealSlot = useMemo(() => {
    // Find the current or next upcoming meal
    for (const slot of mealSlots) {
      const meta = mealMeta[slot.toLowerCase()];
      if (currentHour >= meta.startHour && currentHour < meta.endHour) return { slot, status: 'now' as const };
    }
    for (const slot of mealSlots) {
      const meta = mealMeta[slot.toLowerCase()];
      if (currentHour < meta.startHour) return { slot, status: 'next' as const };
    }
    return null;
  }, [currentHour]);

  const roomLabel = roomNumber
    ? `Room ${roomNumber}${bedNumber ? `, Bed ${bedNumber}` : ''}${blockName ? ` - ${blockName}` : ''}`
    : 'No room assigned yet';

  /* ---- Render ---- */

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ===== Welcome Hero ===== */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-accent/5 ring-1 ring-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {getGreeting()}, {firstName}!
                </h1>
                <p className="text-sm text-muted-foreground">{roomLabel}</p>
                <p className="text-xs text-muted-foreground/70">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <Avatar size="lg" className="hidden sm:flex ring-2 ring-primary/20 size-14">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Getting Started Checklist ===== */}
      <motion.div variants={item}>
        <GettingStarted role="student" />
      </motion.div>

      {/* ===== Stat Cards ===== */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance Due */}
        {balanceLoading ? (
          <SkeletonCard />
        ) : (
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-display font-bold">
                    <span className="text-lg align-top">&#8377;</span>
                    <AnimatedNumber
                      value={balanceData?.totalDue ?? 0}
                      formatFn={(n) => n.toLocaleString('en-IN')}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(balanceData?.totalDue ?? 0) > 0 ? 'Payment pending' : 'All clear'}
                  </p>
                </div>
                <div
                  className={cn(
                    'rounded-xl p-3',
                    (balanceData?.totalDue ?? 0) > 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-success/10 text-success',
                  )}
                >
                  <IndianRupee className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open Complaints */}
        {complaintsLoading ? (
          <SkeletonCard />
        ) : (
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Open Complaints</p>
                  <p className="text-2xl font-display font-bold">
                    <AnimatedNumber value={openComplaints} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {openComplaints > 0 ? `${openComplaints} need attention` : 'No open issues'}
                  </p>
                </div>
                <div
                  className={cn(
                    'rounded-xl p-3',
                    openComplaints > 0
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meals Booked This Week */}
        {menuLoading ? (
          <SkeletonCard />
        ) : (
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Meals Booked</p>
                  <p className="text-2xl font-display font-bold">
                    <AnimatedNumber value={todayMenu?.bookedCount ?? 0} />
                  </p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
                <div className="rounded-xl p-3 bg-primary/10 text-primary">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ===== Today's Meals Widget ===== */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Today&apos;s Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menuLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : todayMenu ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {mealSlots.map((slot) => {
                  const meta = mealMeta[slot.toLowerCase()];
                  const MealIcon = meta.icon;
                  const meal = todayMenu.meals?.find(
                    (m: { type: string }) => m.type.toLowerCase() === slot.toLowerCase(),
                  );
                  const isActive = activeMealSlot?.slot === slot;
                  const status = isActive ? activeMealSlot?.status : null;

                  return (
                    <div
                      key={slot}
                      className={cn(
                        'relative rounded-lg border p-3.5 transition-all',
                        isActive
                          ? 'border-primary/30 bg-primary/[0.04] ring-1 ring-primary/20'
                          : 'border-transparent bg-muted/50',
                      )}
                    >
                      {isActive && (
                        <Badge
                          variant="default"
                          className="absolute -top-2 right-2 text-[10px] px-1.5 py-0"
                        >
                          {status === 'now' ? 'Now Serving' : 'Up Next'}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            'rounded-md p-1.5',
                            isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <MealIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{slot}</p>
                          <p className="text-[10px] text-muted-foreground">{meta.timeRange}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {meal?.items?.join(', ') ?? 'Not available'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No menu available for today
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Quick Actions ===== */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:ring-primary/20 hover:shadow-md">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={cn('rounded-lg p-2.5', action.color)}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ===== Recent Notifications ===== */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : notifications?.length > 0 ? (
              <div className="space-y-2">
                {notifications
                  .slice(0, 5)
                  .map(
                    (n: {
                      id: string;
                      title: string;
                      message: string;
                      type?: string;
                      createdAt: string;
                      read: boolean;
                    }) => {
                      const NIcon = notificationIcons[n.type ?? 'info'] ?? Info;
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            'flex items-start gap-3 rounded-lg p-3 transition-colors',
                            n.read ? 'bg-muted/30' : 'bg-muted/60',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 rounded-md p-1.5 shrink-0',
                              n.read
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            <NIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{n.title}</p>
                              {!n.read && (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {n.message}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap shrink-0 mt-0.5">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      );
                    },
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
