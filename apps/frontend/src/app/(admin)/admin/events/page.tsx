'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Plus, Trash2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

const categories = ['GENERAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'FESTIVAL', 'MEETING'];
const categoryColors: Record<string, string> = {
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CULTURAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SPORTS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ACADEMIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  FESTIVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  MEETING: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export default function AdminEventsPage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? '';
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [imageUrl, setImageUrl] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events', hostelId],
    queryFn: async () => {
      const res = await api.get('/events', { params: { hostelId } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/events', {
        title, description, venue, date, hostelId, category,
        ...(endDate && { endDate }),
        ...(capacity && { capacity: Number(capacity) }),
        ...(imageUrl && { imageUrl }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event created');
      setCreateOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create event'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/events/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted');
      setDeleteTarget(null);
    },
  });

  function resetForm() {
    setTitle(''); setDescription(''); setVenue(''); setDate('');
    setEndDate(''); setCapacity(''); setCategory('GENERAL'); setImageUrl('');
  }

  if (isLoading) return <div className="space-y-4"><PageHeader title="Events" description="Manage hostel events" /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Events"
        description="Create and manage hostel events"
        action={
          <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        }
      />

      {!events?.length ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No events yet</p>
            <Button variant="outline" className="mt-3 rounded-lg" onClick={() => setCreateOpen(true)}>Create First Event</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <Card key={event.id} className="rounded-xl overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-sm">{event.title}</h3>
                  <Badge className={categoryColors[event.category] || categoryColors.GENERAL}>
                    {event.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(event.date), 'MMM d, yyyy h:mm a')}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</div>
                  <div className="flex items-center gap-1"><Users className="h-3 w-3" />{event.goingCount || event._count?.rsvps || 0} RSVPs{event.capacity ? ` / ${event.capacity} capacity` : ''}</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="destructive" className="rounded-lg h-7 text-xs" onClick={() => setDeleteTarget(event.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Create Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input className="rounded-lg" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea className="rounded-lg" value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Describe the event" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input className="rounded-lg" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Location" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" className="rounded-lg" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input type="datetime-local" className="rounded-lg" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Capacity (optional)</Label>
                <Input type="number" className="rounded-lg" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Max attendees" />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input className="rounded-lg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!title || !description || !venue || !date || createMutation.isPending}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Event"
        description="This will remove the event and all RSVPs. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </motion.div>
  );
}
