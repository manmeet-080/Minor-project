'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const categoryColors: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CULTURAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SPORTS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ACADEMIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  FESTIVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  MEETING: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const rsvpButtons = [
  { status: 'GOING', label: 'Going', icon: CheckCircle2, activeClass: 'bg-success text-white hover:bg-success/90' },
  { status: 'MAYBE', label: 'Maybe', icon: HelpCircle, activeClass: 'bg-amber-500 text-white hover:bg-amber-500/90' },
  { status: 'NOT_GOING', label: 'Can\'t Go', icon: XCircle, activeClass: 'bg-muted text-muted-foreground' },
];

export default function StudentEventsPage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', hostelId, category],
    queryFn: async () => {
      const params: any = { hostelId, upcoming: 'true' };
      if (category !== 'all') params.category = category;
      const res = await api.get('/events', { params });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await api.post(`/events/${eventId}/rsvp`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('RSVP updated');
    },
  });

  // Get user's RSVP for each event
  const { data: detailsCache } = useQuery({
    queryKey: ['event-rsvps', userId, data?.map((e: any) => e.id).join(',')],
    queryFn: async () => {
      const details: Record<string, string | null> = {};
      const events = (data || []).slice(0, 20);
      const results = await Promise.allSettled(
        events.map((event: any) => api.get(`/events/${event.id}`)),
      );
      results.forEach((result, i) => {
        details[events[i].id] = result.status === 'fulfilled' ? result.value.data.data.userRsvp : null;
      });
      return details;
    },
    enabled: !!data?.length,
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Events" description="Upcoming hostel events" /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader title="Events" description="Upcoming hostel events and activities" />

      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-40 rounded-lg"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(categoryColors).map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!data?.length ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No upcoming events</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((event: any) => {
            const userRsvp = detailsCache?.[event.id];
            return (
              <Card key={event.id} className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {event.imageUrl && (
                  <div className="h-36 bg-muted overflow-hidden">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold">{event.title}</h3>
                    <Badge className={categoryColors[event.category] || categoryColors.GENERAL}>
                      {event.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(event.date), 'MMM d, yyyy h:mm a')}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.goingCount}{event.capacity ? ` / ${event.capacity}` : ''} going</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {rsvpButtons.map((btn) => {
                      const Icon = btn.icon;
                      const isActive = userRsvp === btn.status;
                      return (
                        <Button
                          key={btn.status}
                          size="sm"
                          variant={isActive ? 'default' : 'outline'}
                          className={`rounded-lg text-xs ${isActive ? btn.activeClass : ''}`}
                          onClick={() => rsvpMutation.mutate({ eventId: event.id, status: btn.status })}
                          disabled={rsvpMutation.isPending}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {btn.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
