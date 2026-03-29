'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft, ChevronRight, Menu, Zap,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  title?: string;
}

function SidebarContent({ items, collapsed, title }: SidebarProps & { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
        {!collapsed ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-base leading-none">{title || 'SHMS'}</span>
              <span className="block text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">Management</span>
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto h-8 w-8 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-sm">
            <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        {!collapsed && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">
            Menu
          </p>
        )}
        <nav className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-sidebar-primary')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer hint */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-sidebar-accent/30 p-3 text-center">
            <p className="text-[10px] text-sidebar-foreground/50">
              Press <kbd className="px-1 py-0.5 rounded bg-sidebar-accent text-[10px] font-mono">⌘K</kbd> to search
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ items, title }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex h-screen sticky top-0 flex-col border-r border-sidebar-border relative z-30"
      >
        <SidebarContent items={items} collapsed={collapsed} title={title} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </motion.aside>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger className="lg:hidden fixed top-3 left-3 z-50 inline-flex items-center justify-center rounded-lg h-10 w-10 bg-background/80 backdrop-blur border border-border/50 shadow-sm hover:bg-muted transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <SidebarContent items={items} collapsed={false} title={title} />
        </SheetContent>
      </Sheet>
    </>
  );
}
