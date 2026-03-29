'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pencil, Save, X, UtensilsCrossed, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { BarChartWrapper } from '@/components/charts/BarChart';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const;

interface MenuItem {
  id?: string;
  day: string;
  dayOfWeek?: string;
  meal: string;
  mealType?: string;
  items: string | string[];
}

interface MenuData {
  menu: MenuItem[];
  stats?: {
    totalBookings: number;
    todayBookings: number;
    mealBreakdown: { meal: string; count: number }[];
  };
}

export default function MessPage() {
  const queryClient = useQueryClient();
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';

  const [editingCell, setEditingCell] = useState<{ day: string; meal: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['mess-menu', hostelId],
    queryFn: async () => {
      const res = await api.get(`/mess/menu/${hostelId}`);
      return res.data.data as MenuData;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { day: string; meal: string; items: string }) => {
      await api.put(`/mess/menu/${hostelId}`, {
        dayOfWeek: payload.day.toUpperCase(),
        mealType: payload.meal.toUpperCase(),
        items: payload.items.split(',').map((s) => s.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess-menu'] });
      toast.success('Menu updated');
      setEditingCell(null);
    },
    onError: () => toast.error('Failed to update menu'),
  });

  const menu = data?.menu ?? [];
  const stats = data?.stats;

  const menuMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of menu) {
      const day = (item.dayOfWeek ?? item.day ?? '').charAt(0).toUpperCase() + (item.dayOfWeek ?? item.day ?? '').slice(1).toLowerCase();
      const meal = (item.mealType ?? item.meal ?? '').charAt(0).toUpperCase() + (item.mealType ?? item.meal ?? '').slice(1).toLowerCase();
      const items = Array.isArray(item.items) ? item.items.join(', ') : item.items;
      map[`${day}-${meal}`] = items;
    }
    return map;
  }, [menu]);

  const mealChartData = useMemo(() => {
    return (
      stats?.mealBreakdown?.map((m) => ({
        meal: m.meal,
        bookings: m.count,
      })) ?? []
    );
  }, [stats]);

  function startEdit(day: string, meal: string) {
    setEditingCell({ day, meal });
    setEditValue(menuMap[`${day}-${meal}`] ?? '');
  }

  function saveEdit() {
    if (!editingCell) return;
    updateMutation.mutate({
      day: editingCell.day,
      meal: editingCell.meal,
      items: editValue,
    });
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue('');
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mess Management" description="Weekly menu and booking statistics" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Mess Management" description="Weekly menu and meal booking statistics" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Today's Bookings"
            value={stats.todayBookings}
            icon={UtensilsCrossed}
            variant="accent"
          />
        </div>
      )}

      {/* Weekly Menu Grid */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Weekly Menu</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-28">Day</th>
                {MEALS.map((meal) => (
                  <th key={meal} className="text-left py-2 px-3 font-medium text-muted-foreground">
                    {meal}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b last:border-0">
                  <td className="py-3 pr-3 font-medium">{day}</td>
                  {MEALS.map((meal) => {
                    const isEditing =
                      editingCell?.day === day && editingCell?.meal === meal;
                    const value = menuMap[`${day}-${meal}`] ?? '';

                    return (
                      <td key={meal} className="py-3 px-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-8 rounded-lg text-sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              onClick={saveEdit}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              onClick={cancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="group flex items-center gap-1 text-left hover:text-primary transition-colors w-full"
                            onClick={() => startEdit(day, meal)}
                          >
                            <span className="flex-1">
                              {value || (
                                <span className="text-muted-foreground italic">Not set</span>
                              )}
                            </span>
                            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Meal Booking Stats Chart */}
      {mealChartData.length > 0 && (
        <BarChartWrapper
          title="Meal Booking Statistics"
          data={mealChartData}
          xKey="meal"
          yKeys={[{ key: 'bookings', color: '#3b82f6', label: 'Bookings' }]}
        />
      )}
    </motion.div>
  );
}
