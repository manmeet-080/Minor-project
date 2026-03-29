'use client';

import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { ProfileDropdown } from './ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface TopbarProps {
  onSearchClick?: () => void;
}

export function Topbar({ onSearchClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-4 ml-12 lg:ml-0">
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-1">
          {/* Search trigger */}
          <Button
            variant="ghost"
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => {
              // Trigger Cmd+K
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium ml-2">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <ThemeToggle />
          <NotificationCenter />
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
