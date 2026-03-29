'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BedDouble, Building2, Layers, DoorOpen, Wifi, Wind, Droplets, Zap, Tv, ShowerHead } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  'air conditioning': Wind,
  ac: Wind,
  water: Droplets,
  electricity: Zap,
  tv: Tv,
  bathroom: ShowerHead,
};

function getAmenityIcon(name: string) {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(amenityIcons)) {
    if (key.includes(k)) return Icon;
  }
  return Zap;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentRoomPage() {
  const user = useAuthStore((s) => s.user);
  const studentProfile = user?.studentProfile;

  const { data: roomData, isLoading } = useQuery({
    queryKey: ['student-room', user?.id],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: !!user?.id,
  });

  const profile = roomData?.studentProfile ?? studentProfile;
  const bed = profile?.bed;
  const room = bed?.room;
  const block = room?.block;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Room" description="Your room details and roommates" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!bed || !room) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Room" description="Your room details and roommates" />
        <EmptyState
          icon={BedDouble}
          title="No Room Assigned"
          description="You have not been assigned a room yet. Please contact the hostel office."
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader title="My Room" description="Your room details and roommates" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room details card */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display text-lg">Room Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Block</p>
                  <p className="text-sm font-medium">{block?.name ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Floor</p>
                  <p className="text-sm font-medium">{room?.floor ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <DoorOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="text-sm font-medium">{room?.roomNumber ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <BedDouble className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Bed</p>
                  <p className="text-sm font-medium">{bed?.bedNumber ?? 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {room?.amenities && room.amenities.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity: string) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <Badge key={amenity} variant="secondary" className="gap-1.5 py-1 px-2.5">
                        <Icon className="h-3 w-3" />
                        {amenity}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {room?.type && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Room Type:</span>
                <Badge variant="outline">{room.type}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roommates card */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display text-lg">Roommates</CardTitle>
          </CardHeader>
          <CardContent>
            {room?.beds && room.beds.length > 0 ? (
              <div className="space-y-3">
                {room.beds
                  .filter((b: { student?: { id: string } }) => b.student && b.student.id !== user?.id)
                  .map((b: { id: string; bedNumber: string; student: { id: string; user: { name: string; avatarUrl?: string; email: string } } }) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Avatar size="lg">
                        {b.student.user.avatarUrl ? (
                          <AvatarImage src={b.student.user.avatarUrl} />
                        ) : null}
                        <AvatarFallback>{getInitials(b.student.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.student.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.student.user.email}</p>
                      </div>
                      <Badge variant="secondary">Bed {b.bedNumber}</Badge>
                    </div>
                  ))}
                {room.beds.filter(
                  (b: { student?: { id: string } }) => b.student && b.student.id !== user?.id
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No roommates assigned yet
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No roommate information available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
