'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Megaphone } from 'lucide-react';
import { useSocketEvent } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle2,
  ERROR: XCircle,
  ANNOUNCEMENT: Megaphone,
};

const typeColors: Record<string, string> = {
  INFO: 'text-blue-500 bg-blue-500/10',
  WARNING: 'text-amber-500 bg-amber-500/10',
  SUCCESS: 'text-emerald-500 bg-emerald-500/10',
  ERROR: 'text-rose-500 bg-rose-500/10',
  ANNOUNCEMENT: 'text-primary bg-primary/10',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=20');
      return res.data.data as { notifications: Notification[]; unreadCount: number };
    },
    refetchInterval: 60000,
  });

  // Real-time socket listeners
  const handleBroadcast = useCallback((data: { title: string; message: string }) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.info(data.title, { description: data.message });
  }, [queryClient]);

  const handleComplaintStatus = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.info(`Complaint: ${data.title}`, { description: `Status changed to ${data.status}` });
  }, [queryClient]);

  const handleGatePassDecision = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.info('Gate Pass Update', { description: `Your gate pass has been ${data.status?.toLowerCase()}` });
  }, [queryClient]);

  const handlePayment = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.success('Payment Recorded', { description: `Rs. ${data.amount} payment received` });
  }, [queryClient]);

  const handleNewComplaint = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.info('New Complaint', { description: data.title });
  }, [queryClient]);

  useSocketEvent('notification:broadcast', handleBroadcast);
  useSocketEvent('complaint:statusChanged', handleComplaintStatus);
  useSocketEvent('gatePass:decision', handleGatePassDecision);
  useSocketEvent('fee:paymentRecorded', handlePayment);
  useSocketEvent('complaint:new', handleNewComplaint);

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-xs text-muted-foreground mt-0.5">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                    className={cn(
                      'w-full flex gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                      !n.isRead && 'bg-primary/[0.02]',
                    )}
                  >
                    <div className={cn('rounded-lg p-2 h-fit shrink-0', typeColors[n.type] || typeColors.INFO)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm leading-tight', !n.isRead && 'font-medium')}>{n.title}</p>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
