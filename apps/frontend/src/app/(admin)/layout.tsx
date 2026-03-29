'use client';

import { AppSidebar, NavItem } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  LayoutDashboard, Users, BedDouble, AlertTriangle, Receipt,
  UtensilsCrossed, DoorOpen, UserCheck, BarChart3, Settings,
} from 'lucide-react';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Rooms', href: '/admin/rooms', icon: BedDouble },
  { label: 'Complaints', href: '/admin/complaints', icon: AlertTriangle },
  { label: 'Fees', href: '/admin/fees', icon: Receipt },
  { label: 'Mess', href: '/admin/mess', icon: UtensilsCrossed },
  { label: 'Gate Passes', href: '/admin/gate-passes', icon: DoorOpen },
  { label: 'Visitors', href: '/admin/visitors', icon: UserCheck },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar items={navItems} title="Campusphere" />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />
        <main className="flex-1">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
