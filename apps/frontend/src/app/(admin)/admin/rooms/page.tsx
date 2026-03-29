'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BedDouble, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { OccupancyGrid } from '@/components/admin/OccupancyGrid';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

interface Bed {
  id: string;
  bedNumber: string;
  isOccupied: boolean;
  student?: { user: { name: string }; rollNumber: string };
}

interface Room {
  id: string;
  roomNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PARTIALLY_OCCUPIED' | 'UNDER_MAINTENANCE';
  capacity: number;
  occupied: number;
  beds?: Bed[];
}

interface Block {
  id: string;
  name: string;
}

export default function RoomsPage() {
  const hostelId = useAuthStore((s) => s.user?.hostelId) ?? 'default';
  const [activeBlock, setActiveBlock] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks', hostelId],
    queryFn: async () => {
      const res = await api.get(`/rooms/blocks/${hostelId}`);
      return res.data.data as Block[];
    },
  });

  const blockId = activeBlock === 'ALL' ? undefined : activeBlock;

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', hostelId, blockId],
    queryFn: async () => {
      const params: Record<string, string> = { hostelId };
      if (blockId) params.blockId = blockId;
      const res = await api.get('/rooms', { params });
      return res.data.data as Room[];
    },
  });

  const { data: roomDetail } = useQuery({
    queryKey: ['room-detail', selectedRoom?.id],
    queryFn: async () => {
      const res = await api.get(`/rooms/${selectedRoom!.id}`);
      return res.data.data as Room;
    },
    enabled: !!selectedRoom,
  });

  const gridRooms = useMemo(
    () =>
      rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        status: r.status,
        capacity: r.capacity,
        occupied: r.occupied,
      })),
    [rooms],
  );

  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupied, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rooms" description="Room occupancy and management" />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="Rooms"
        description={`${totalOccupied} / ${totalCapacity} beds occupied across ${rooms.length} rooms`}
      />

      {/* Block Filter Tabs */}
      <Tabs value={activeBlock} onValueChange={setActiveBlock}>
        <TabsList className="rounded-lg">
          <TabsTrigger value="ALL" className="rounded-lg">
            All Blocks
          </TabsTrigger>
          {blocks.map((block) => (
            <TabsTrigger key={block.id} value={block.id} className="rounded-lg">
              {block.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeBlock} className="mt-4">
          <OccupancyGrid
            title={activeBlock === 'ALL' ? 'All Rooms' : `Block ${blocks.find((b) => b.id === activeBlock)?.name}`}
            rooms={gridRooms}
            onRoomClick={(room) =>
              setSelectedRoom(rooms.find((r) => r.id === room.id) ?? null)
            }
          />
        </TabsContent>
      </Tabs>

      {/* Room Detail Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Room {selectedRoom?.roomNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">{selectedRoom?.capacity} beds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Occupied</span>
              <span className="font-medium">{selectedRoom?.occupied}</span>
            </div>
          </div>

          {/* Bed Map */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Bed Map</p>
            <div className="grid grid-cols-2 gap-2">
              {(roomDetail?.beds ?? selectedRoom?.beds ?? []).map((bed) => (
                <div
                  key={bed.id}
                  className={`rounded-xl border p-3 text-center text-sm ${
                    bed.isOccupied
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/40 border-border'
                  }`}
                >
                  <BedDouble className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-medium">{bed.bedNumber}</p>
                  {bed.isOccupied && bed.student ? (
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{bed.student.user.name}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Available
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
