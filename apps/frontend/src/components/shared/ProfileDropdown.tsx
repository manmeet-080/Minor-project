'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Shield, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-primary/10 text-primary',
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-500',
  WARDEN: 'bg-amber-500/10 text-amber-500',
  STAFF: 'bg-emerald-500/10 text-emerald-500',
  STUDENT: 'bg-blue-500/10 text-blue-500',
};

export function ProfileDropdown() {
  const router = useRouter();
  const { user, logout: logoutStore, refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* continue */ }
    logoutStore();
    router.push('/login');
  };

  const profilePath = user?.role === 'STUDENT' ? '/student/profile' : `/${user?.role?.toLowerCase()}/settings`;
  const settingsPath = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'WARDEN'
    ? '/admin/settings' : '/student/profile';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <Badge variant="secondary" className={`text-[10px] mt-0.5 ${roleBadgeColors[user?.role || '']}`}>
                  {user?.role}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(profilePath)} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(settingsPath)} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
