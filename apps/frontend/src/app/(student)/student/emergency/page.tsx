'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShieldAlert, Phone, Siren, Flame, Activity, Shield,
  CheckCircle2, AlertTriangle, Building2, Stethoscope,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api/client';

const emergencyContacts = [
  { name: 'Police', number: '112', icon: Shield, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Ambulance', number: '108', icon: Stethoscope, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { name: 'Fire Brigade', number: '101', icon: Flame, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { name: 'Campus Security', number: '1800-XXX-XXXX', icon: Building2, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
];

const safetyInstructions = [
  {
    title: 'Fire Emergency',
    icon: Flame,
    color: 'text-orange-500',
    steps: [
      'Activate the nearest fire alarm',
      'Evacuate using stairs — DO NOT use elevators',
      'Crawl low if there is smoke',
      'Assemble at the designated meeting point',
      'Call 101 and campus security',
    ],
  },
  {
    title: 'Medical Emergency',
    icon: Activity,
    color: 'text-red-500',
    steps: [
      'Do not move the injured person unless in immediate danger',
      'Call 108 for ambulance immediately',
      'Provide basic first aid if trained',
      'Stay with the person until help arrives',
      'Notify hostel warden/staff',
    ],
  },
  {
    title: 'Security Threat',
    icon: Shield,
    color: 'text-blue-500',
    steps: [
      'Move to a safe and secure location',
      'Lock doors and windows if possible',
      'Do not confront the threat',
      'Call 112 and campus security',
      'Use the Panic Button to alert hostel management',
    ],
  },
  {
    title: 'Natural Disaster',
    icon: AlertTriangle,
    color: 'text-amber-500',
    steps: [
      'Drop, Cover, and Hold On (earthquake)',
      'Move away from windows and heavy objects',
      'Follow staff evacuation instructions',
      'Assemble at the open ground meeting point',
      'Do not re-enter the building until cleared',
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function EmergencyPage() {
  const [panicConfirmOpen, setPanicConfirmOpen] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertTime, setAlertTime] = useState<string | null>(null);

  const panicMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/sos');
    },
    onSuccess: () => {
      setAlertSent(true);
      setAlertTime(new Date().toLocaleTimeString());
      toast.success('Emergency alert sent to hostel management');
    },
    onError: () => {
      toast.error('Failed to send alert — please call 112 directly');
    },
  });

  function handlePanicConfirm() {
    panicMutation.mutate(undefined, {
      onSettled: () => {
        // Redirect to phone after API call completes (success or failure)
        window.location.href = 'tel:112';
      },
    });
    setPanicConfirmOpen(false);
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          title="Emergency"
          description="Emergency contacts, safety instructions, and panic alert"
        />
      </motion.div>

      {/* Panic Button Section */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-destructive/30 bg-destructive/[0.02]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <Siren className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Panic Alert</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Press the button below to instantly alert hostel warden, admins, and staff.
                  This will also initiate a call to emergency services (112).
                </p>
              </div>

              {alertSent ? (
                <div className="flex items-center gap-2 bg-success/10 text-success rounded-xl px-5 py-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">Alert Sent Successfully</p>
                    <p className="text-xs opacity-80">at {alertTime}</p>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-lg px-8 py-6 font-bold shadow-lg"
                  onClick={() => setPanicConfirmOpen(true)}
                  disabled={panicMutation.isPending}
                >
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  {panicMutation.isPending ? 'Sending Alert...' : 'SEND PANIC ALERT'}
                </Button>
              )}

              {alertSent && (
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => { setAlertSent(false); setAlertTime(null); }}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Emergency Contacts */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Emergency Contacts</CardTitle>
            <CardDescription>Tap to call directly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyContacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <a key={contact.name} href={`tel:${contact.number}`}>
                    <div className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className={`rounded-lg p-2 ${contact.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.number}</p>
                      </div>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Safety Instructions */}
      <motion.div variants={item}>
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Safety Instructions</CardTitle>
            <CardDescription>What to do in an emergency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {safetyInstructions.map((instruction, idx) => {
              const Icon = instruction.icon;
              return (
                <div key={instruction.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${instruction.color}`} />
                    <h4 className="font-medium text-sm">{instruction.title}</h4>
                  </div>
                  <ol className="space-y-1.5 ml-6">
                    {instruction.steps.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 w-5 p-0 flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </Badge>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {idx < safetyInstructions.length - 1 && <Separator className="mt-4" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={panicConfirmOpen}
        onOpenChange={setPanicConfirmOpen}
        title="Send Emergency Alert?"
        description="This will immediately notify all hostel wardens, admins, and staff about your emergency. A call to 112 will also be initiated. Only use this in a real emergency."
        confirmLabel="Yes, Send Alert"
        variant="destructive"
        onConfirm={handlePanicConfirm}
      />
    </motion.div>
  );
}
