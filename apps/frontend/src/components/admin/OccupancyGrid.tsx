'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RoomData {
  id: string;
  roomNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PARTIALLY_OCCUPIED' | 'UNDER_MAINTENANCE';
  capacity: number;
  occupied: number;
}

interface OccupancyGridProps {
  title?: string;
  rooms: RoomData[];
  onRoomClick?: (room: RoomData) => void;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-success/20 border-success/40 hover:bg-success/30',
  OCCUPIED: 'bg-primary/20 border-primary/40 hover:bg-primary/30',
  PARTIALLY_OCCUPIED: 'bg-accent/20 border-accent/40 hover:bg-accent/30',
  UNDER_MAINTENANCE: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Full',
  PARTIALLY_OCCUPIED: 'Partial',
  UNDER_MAINTENANCE: 'Maintenance',
};

export function OccupancyGrid({ title = 'Room Occupancy', rooms, onRoomClick }: OccupancyGridProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base">{title}</CardTitle>
          <div className="flex gap-3">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn('h-3 w-3 rounded-sm border', statusColors[key])} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {rooms.map((room) => (
            <Tooltip key={room.id}>
              <TooltipTrigger
                onClick={() => onRoomClick?.(room)}
                className={cn(
                  'aspect-square rounded-lg border text-xs font-medium flex items-center justify-center transition-colors cursor-pointer',
                  statusColors[room.status],
                )}
              >
                {room.roomNumber}
              </TooltipTrigger>
              <TooltipContent>
                <p>Room {room.roomNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {room.occupied}/{room.capacity} beds occupied
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
