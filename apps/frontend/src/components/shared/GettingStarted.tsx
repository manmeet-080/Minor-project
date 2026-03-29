'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, X, Sparkles, Users, BedDouble, UtensilsCrossed, Settings, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Step {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const adminSteps: Step[] = [
  { id: 'hostel', label: 'Configure hostel details', description: 'Set up your hostel name, address, and basic settings', href: '/admin/settings', icon: Settings },
  { id: 'rooms', label: 'Set up rooms & beds', description: 'Create blocks, rooms, and define bed capacity', href: '/admin/rooms', icon: BedDouble },
  { id: 'students', label: 'Approve student registrations', description: 'Review and approve pending student applications', href: '/admin/students', icon: Users },
  { id: 'mess', label: 'Configure mess menu', description: 'Set up weekly meal schedules and menu items', href: '/admin/mess', icon: UtensilsCrossed },
  { id: 'fees', label: 'Create fee structures', description: 'Define hostel fees, mess charges, and due dates', href: '/admin/fees', icon: AlertTriangle },
];

const studentSteps: Step[] = [
  { id: 'profile', label: 'Complete your profile', description: 'Add your personal and parent/guardian details', href: '/student/profile', icon: Users },
  { id: 'room', label: 'View your room assignment', description: 'Check your assigned room and roommates', href: '/student/room', icon: BedDouble },
  { id: 'mess', label: 'Book your first meal', description: 'Browse the menu and book upcoming meals', href: '/student/mess', icon: UtensilsCrossed },
];

export function GettingStarted({ role }: { role: 'admin' | 'student' }) {
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const storageKey = `campusphere-onboarding-${role}`;
  const dismissKey = `campusphere-onboarding-dismissed-${role}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setCompletedSteps(JSON.parse(saved));
    if (localStorage.getItem(dismissKey) === 'true') setDismissed(true);
  }, [storageKey, dismissKey]);

  const steps = role === 'admin' ? adminSteps : studentSteps;
  const progress = Math.round((completedSteps.length / steps.length) * 100);

  const toggleStep = (id: string) => {
    const updated = completedSteps.includes(id)
      ? completedSteps.filter((s) => s !== id)
      : [...completedSteps, id];
    setCompletedSteps(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(dismissKey, 'true');
  };

  if (dismissed || progress === 100) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="rounded-xl border-primary/20 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-base">Getting Started</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedSteps.length}/{steps.length} completed
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Progress value={progress} className="h-1.5 mt-3" />
          </CardHeader>
          <CardContent className="space-y-1">
            {steps.map((step) => {
              const done = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2.5 transition-colors group',
                    done ? 'opacity-60' : 'hover:bg-muted/50',
                  )}
                >
                  <button onClick={() => toggleStep(step.id)} className="shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    )}
                  </button>
                  <Link href={step.href} className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', done && 'line-through')}>{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </Link>
                  <step.icon className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
