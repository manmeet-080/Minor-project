'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard, Users, BedDouble, AlertTriangle, Receipt,
  UtensilsCrossed, BarChart3, DoorOpen, User, UserCheck, Settings,
  Search, ArrowRight, X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
}

const adminCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Students', href: '/admin/students', icon: Users, group: 'Navigation', keywords: 'manage approve reject' },
  { label: 'Rooms', href: '/admin/rooms', icon: BedDouble, group: 'Navigation', keywords: 'occupancy beds allocate' },
  { label: 'Complaints', href: '/admin/complaints', icon: AlertTriangle, group: 'Navigation', keywords: 'issues problems' },
  { label: 'Fees', href: '/admin/fees', icon: Receipt, group: 'Navigation', keywords: 'payments billing' },
  { label: 'Mess', href: '/admin/mess', icon: UtensilsCrossed, group: 'Navigation', keywords: 'food menu meals' },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, group: 'Navigation', keywords: 'analytics export' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, group: 'Navigation', keywords: 'preferences configuration' },
];

const studentCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'My Room', href: '/student/room', icon: BedDouble, group: 'Navigation' },
  { label: 'Fees', href: '/student/fees', icon: Receipt, group: 'Navigation', keywords: 'payments dues' },
  { label: 'Complaints', href: '/student/complaints', icon: AlertTriangle, group: 'Navigation', keywords: 'file issue' },
  { label: 'Mess', href: '/student/mess', icon: UtensilsCrossed, group: 'Navigation', keywords: 'food book meals' },
  { label: 'Gate Pass', href: '/student/gate-pass', icon: DoorOpen, group: 'Navigation', keywords: 'leave outing' },
  { label: 'Profile', href: '/student/profile', icon: User, group: 'Navigation', keywords: 'account settings' },
];

const staffCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Complaints', href: '/staff/complaints', icon: AlertTriangle, group: 'Navigation' },
  { label: 'Visitors', href: '/staff/visitors', icon: UserCheck, group: 'Navigation' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = useCallback(() => {
    switch (user?.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'WARDEN':
        return adminCommands;
      case 'STAFF':
        return staffCommands;
      default:
        return studentCommands;
    }
  }, [user?.role]);

  const runCommand = (href: string) => {
    setOpen(false);
    setSearch('');
    router.push(href);
  };

  const grouped = commands().reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => { setOpen(false); setSearch(''); }}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[520px] px-4 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150">
        <Command
          className="rounded-2xl border border-border/60 bg-popover shadow-2xl overflow-hidden"
          shouldFilter={true}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 border-b border-border/50">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, actions..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <button
              onClick={() => { setOpen(false); setSearch(''); }}
              className="shrink-0 flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-[320px] overflow-y-auto overscroll-contain p-1.5 scrollbar-thin">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground/60">
              No results found.
            </Command.Empty>

            {Object.entries(grouped).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/50"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keywords || ''}`}
                    onSelect={() => runCommand(item.href)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors duration-100 text-foreground/80 data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground aria-selected:bg-primary/10 aria-selected:text-foreground"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 group-data-[selected=true]:bg-primary/15 group-aria-selected:bg-primary/15 transition-colors">
                      <item.icon className="h-4 w-4 text-muted-foreground group-data-[selected=true]:text-primary group-aria-selected:text-primary transition-colors" />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-data-[selected=true]:opacity-100 group-aria-selected:opacity-100 transition-opacity" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-[11px] text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-muted/70 px-1 font-mono text-[10px]">↑</kbd>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-muted/70 px-1 font-mono text-[10px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-muted/70 px-1 font-mono text-[10px]">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-muted/70 px-1 font-mono text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
