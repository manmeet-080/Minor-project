'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Check, X } from 'lucide-react';
import { format, startOfWeek, addDays, isAfter, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mealSlots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;

interface MealItem {
  type: string;
  items: string[];
}

interface DayMenu {
  id: string;
  date: string;
  meals: MealItem[];
  bookedMeals?: string[];
}

export default function StudentMessPage() {
  const user = useAuthStore((s) => s.user);
  const hostelId = user?.hostelId;
  const studentId = user?.studentProfile?.id;
  const queryClient = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['mess-menu', hostelId, weekOffset],
    queryFn: () => api.get(`/mess/menu/${hostelId}`).then((r) => r.data.data),
    enabled: !!hostelId,
  });

  const bookMutation = useMutation({
    mutationFn: (payload: { date: string; mealType: string }) =>
      api.post('/mess/book', { studentId, hostelId, date: payload.date, mealType: payload.mealType }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      toast.success(`Booked ${variables.mealType} for ${format(new Date(variables.date), 'MMM d')}`);
      queryClient.invalidateQueries({ queryKey: ['mess-menu', hostelId] });
    },
    onError: () => {
      toast.error('Failed to book meal');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { date: string; mealType: string }) =>
      api.post('/mess/cancel', { studentId, date: payload.date, mealType: payload.mealType }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      toast.success(`Cancelled ${variables.mealType} for ${format(new Date(variables.date), 'MMM d')}`);
      queryClient.invalidateQueries({ queryKey: ['mess-menu', hostelId] });
    },
    onError: () => {
      toast.error('Failed to cancel meal');
    },
  });

  const getMenuForDate = (date: Date): DayMenu | undefined => {
    return menuData?.find((m: DayMenu) => isSameDay(new Date(m.date), date));
  };

  const isMealBooked = (dayMenu: DayMenu | undefined, mealType: string): boolean => {
    return dayMenu?.bookedMeals?.includes(mealType) ?? false;
  };

  const isUpcoming = (date: Date): boolean => {
    const now = new Date();
    return isAfter(date, now) || isSameDay(date, now);
  };

  const handleToggleMeal = (date: Date, mealType: string, booked: boolean) => {
    const payload = {
      date: format(date, 'yyyy-MM-dd'),
      mealType: mealType.toUpperCase(),
    };
    if (booked) {
      cancelMutation.mutate(payload);
    } else {
      bookMutation.mutate(payload);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Mess Menu"
        description="View weekly menu and manage your meal bookings"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        Week of {format(weekStart, 'MMMM d, yyyy')}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weekDays.map((day) => {
            const dayMenu = getMenuForDate(day);
            const upcoming = isUpcoming(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                className={`rounded-xl ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm flex items-center justify-between">
                    <span>{format(day, 'EEEE')}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {format(day, 'MMM d')}
                    </span>
                  </CardTitle>
                  {isToday && (
                    <Badge variant="default" className="w-fit text-xs">
                      Today
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {mealSlots.map((slot) => {
                    const meal = dayMenu?.meals?.find(
                      (m) => m.type.toLowerCase() === slot.toLowerCase()
                    );
                    const booked = isMealBooked(dayMenu, slot);

                    return (
                      <div
                        key={slot}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{slot}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {meal?.items?.join(', ') ?? 'N/A'}
                          </p>
                        </div>
                        {upcoming && (
                          <Button
                            variant={booked ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0"
                            onClick={() => handleToggleMeal(day, slot, booked)}
                            disabled={bookMutation.isPending || cancelMutation.isPending}
                          >
                            {booked ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !menuData?.length && (
        <EmptyState
          icon={UtensilsCrossed}
          title="No Menu Available"
          description="The mess menu for this week hasn't been published yet."
        />
      )}
    </motion.div>
  );
}
