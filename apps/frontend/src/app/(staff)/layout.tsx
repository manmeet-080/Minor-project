'use client';

import { AppSidebar, NavItem } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LayoutDashboard, AlertTriangle, UserCheck, CalendarDays } from 'lucide-react';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Complaints', href: '/staff/complaints', icon: AlertTriangle },
  { label: 'Attendance', href: '/staff/attendance', icon: CalendarDays },
  { label: 'Visitors', href: '/staff/visitors', icon: UserCheck },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
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
