'use client';

import { AppSidebar, NavItem } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Phone, LayoutDashboard, BedDouble, Receipt, AlertTriangle, UtensilsCrossed, DoorOpen, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'My Room', href: '/student/room', icon: BedDouble },
  { label: 'Fees', href: '/student/fees', icon: Receipt },
  { label: 'Complaints', href: '/student/complaints', icon: AlertTriangle },
  { label: 'Mess', href: '/student/mess', icon: UtensilsCrossed },
  { label: 'Gate Pass', href: '/student/gate-pass', icon: DoorOpen },
  { label: 'Profile', href: '/student/profile', icon: User },
];

const mobileNav = [
  { label: 'Home', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Complaints', href: '/student/complaints', icon: AlertTriangle },
  { label: 'Mess', href: '/student/mess', icon: UtensilsCrossed },
  { label: 'Profile', href: '/student/profile', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <AppSidebar items={navItems} title="SHMS" />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        <main className="flex-1">
          <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>

        {/* SOS Button */}
        <a href="tel:112" className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
          <Button size="lg" className="rounded-full bg-destructive hover:bg-destructive/90 shadow-lg h-14 w-14">
            <Phone className="h-6 w-6" />
          </Button>
        </a>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 z-30 px-2 pb-safe">
          <div className="flex justify-around">
            {mobileNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}>
                    <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
