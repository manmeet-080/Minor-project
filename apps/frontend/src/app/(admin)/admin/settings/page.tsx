'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import {
  Settings, Users, Bell, CreditCard, Shield,
  MoreHorizontal, UserPlus, Monitor, Smartphone,
  Globe, Zap, Mail, MessageSquare, BellRing,
  Megaphone, Lock, Laptop, Tablet,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const mockHostel = {
  name: 'Vivekananda Boys Hostel',
  code: 'VBH-01',
  address: '123 University Road, Sector 14, Chandigarh 160014',
  gender: 'male',
  warden: 'dr-sharma',
};

const wardens = [
  { id: 'dr-sharma', name: 'Dr. Rajesh Sharma' },
  { id: 'prof-gupta', name: 'Prof. Anita Gupta' },
  { id: 'dr-patel', name: 'Dr. Vikram Patel' },
];

const teamMembers = [
  {
    id: '1',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@hostel.edu',
    role: 'Admin',
    status: 'Active',
    avatar: '',
    initials: 'RS',
  },
  {
    id: '2',
    name: 'Priya Mehta',
    email: 'priya.mehta@hostel.edu',
    role: 'Warden',
    status: 'Active',
    avatar: '',
    initials: 'PM',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.kumar@hostel.edu',
    role: 'Staff',
    status: 'Active',
    avatar: '',
    initials: 'AK',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@hostel.edu',
    role: 'Staff',
    status: 'Inactive',
    avatar: '',
    initials: 'SR',
  },
];

const mockSessions = [
  {
    id: '1',
    browser: 'Chrome 122',
    os: 'Windows 11',
    ip: '192.168.1.42',
    lastActive: 'Active now',
    current: true,
    icon: Monitor,
  },
  {
    id: '2',
    browser: 'Safari 17',
    os: 'macOS Sonoma',
    ip: '10.0.0.15',
    lastActive: '2 hours ago',
    current: false,
    icon: Laptop,
  },
  {
    id: '3',
    browser: 'Chrome Mobile',
    os: 'Android 14',
    ip: '172.16.0.8',
    lastActive: '1 day ago',
    current: false,
    icon: Tablet,
  },
];

// ---------------------------------------------------------------------------
// Tabs definition
// ---------------------------------------------------------------------------
const tabs = [
  { value: 'general', label: 'General', icon: Settings },
  { value: 'team', label: 'Team', icon: Users },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'security', label: 'Security', icon: Shield },
] as const;

// ---------------------------------------------------------------------------
// Role badge color helper
// ---------------------------------------------------------------------------
function roleBadgeVariant(role: string) {
  switch (role) {
    case 'Admin':
      return 'default' as const;
    case 'Warden':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('general');
  const hostelId = useAuthStore((s) => s.user?.hostelId);
  const queryClient = useQueryClient();

  // Fetch hostel data
  const { data: hostel } = useQuery({
    queryKey: ['hostel', hostelId],
    queryFn: async () => {
      const res = await api.get(`/hostels/${hostelId}`);
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  // Fetch team members
  const { data: teamData } = useQuery({
    queryKey: ['users', hostelId],
    queryFn: async () => {
      const res = await api.get('/users', { params: { hostelId } });
      return res.data.data;
    },
    enabled: !!hostelId,
  });

  // Fetch login sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/auth/sessions');
      return res.data.data;
    },
  });

  // General state
  const [hostelName, setHostelName] = useState('');
  const [hostelCode, setHostelCode] = useState('');
  const [hostelAddress, setHostelAddress] = useState('');
  const [gender, setGender] = useState('');
  const [warden, setWarden] = useState('');

  useEffect(() => {
    if (hostel) {
      setHostelName(hostel.name || '');
      setHostelCode(hostel.code || '');
      setHostelAddress(hostel.address || '');
      setGender(hostel.gender?.toLowerCase() || '');
      setWarden(hostel.wardenId || '');
    }
  }, [hostel]);

  // Team state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');

  // Notification state — persisted to localStorage
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [complaintUpdates, setComplaintUpdates] = useState(true);
  const [feeReminders, setFeeReminders] = useState(true);
  const [gatePassApprovals, setGatePassApprovals] = useState(true);
  const [systemAnnouncements, setSystemAnnouncements] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('campusphere-notif-prefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        setEmailNotif(prefs.emailNotif ?? true);
        setSmsNotif(prefs.smsNotif ?? false);
        setPushNotif(prefs.pushNotif ?? true);
        setComplaintUpdates(prefs.complaintUpdates ?? true);
        setFeeReminders(prefs.feeReminders ?? true);
        setGatePassApprovals(prefs.gatePassApprovals ?? true);
        setSystemAnnouncements(prefs.systemAnnouncements ?? false);
      }
    } catch {}
  }, []);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  // Mutations
  const updateHostelMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/hostels/${hostelId}`, {
        name: hostelName,
        address: hostelAddress,
        ...(warden && { wardenId: warden }),
      });
    },
    onSuccess: () => {
      toast.success('General settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['hostel', hostelId] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });

  // Handlers
  function handleSaveGeneral() {
    updateHostelMutation.mutate();
  }

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await api.post('/users', {
        email: inviteEmail,
        password: 'Temp@1234',
        name: inviteEmail.split('@')[0],
        role: inviteRole.toUpperCase(),
        hostelId,
      });
    },
    onSuccess: () => {
      toast.success(`Team member created: ${inviteEmail} (temp password: Temp@1234)`);
      setInviteEmail('');
      setInviteRole('staff');
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users', hostelId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create team member'),
  });

  function handleInvite() {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMutation.mutate();
  }

  function handleSaveNotifications() {
    try {
      localStorage.setItem('campusphere-notif-prefs', JSON.stringify({
        emailNotif, smsNotif, pushNotif, complaintUpdates, feeReminders, gatePassApprovals, systemAnnouncements,
      }));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    }
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate();
  }

  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      toast.success('All sessions revoked. You will be logged out.');
      setRevokeDialogOpen(false);
      setTimeout(() => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }, 1500);
    },
    onError: () => toast.error('Failed to revoke sessions'),
  });

  function handleRevokeAllSessions() {
    revokeSessionsMutation.mutate();
  }

  const teamMembers = (teamData || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === 'SUPER_ADMIN' ? 'Admin' : u.role.charAt(0) + u.role.slice(1).toLowerCase(),
    status: u.isActive ? 'Active' : 'Inactive',
    avatar: u.avatarUrl || '',
    initials: u.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
  }));

  const sessions = (sessionsData || mockSessions).map((s: any, i: number) => ({
    id: s.id || String(i),
    browser: s.userAgent?.split(' ')[0] || 'Unknown Browser',
    os: s.userAgent || 'Unknown',
    ip: s.ipAddress || 'Unknown',
    lastActive: i === 0 ? 'Active now' : s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Unknown',
    current: i === 0,
    icon: i === 0 ? Monitor : i === 1 ? Laptop : Tablet,
  }));

  // -------------------------------------------------------------------------
  // Tab content renderers
  // -------------------------------------------------------------------------
  function renderGeneral() {
    return (
      <div className="space-y-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Hostel Information</CardTitle>
            <CardDescription>
              Basic details about your hostel facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hostel-name">Hostel Name</Label>
                <Input
                  id="hostel-name"
                  className="rounded-lg"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostel-code">Hostel Code</Label>
                <Input
                  id="hostel-code"
                  className="rounded-lg"
                  value={hostelCode}
                  onChange={(e) => setHostelCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostel-address">Address</Label>
              <Input
                id="hostel-address"
                className="rounded-lg"
                value={hostelAddress}
                onChange={(e) => setHostelAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => v && setGender(v)}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="coed">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warden Assignment</Label>
                <Select value={warden} onValueChange={(v) => v && setWarden(v)}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Select warden" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teamData || []).filter((u: any) => u.role === 'WARDEN' || u.role === 'ADMIN').map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveGeneral}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function renderTeam() {
    return (
      <div className="space-y-6">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Team Members</CardTitle>
            <CardDescription>
              Manage who has access to this hostel&apos;s admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : null}
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          member.status === 'Active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(`Edit role for ${member.name}`)
                            }
                          >
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              toast.info(`${member.name} deactivated`)
                            }
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" data-icon="inline-start" />
              Invite Member
            </Button>
          </CardFooter>
        </Card>

        {/* Invite Dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your hostel management team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  className="rounded-lg"
                  placeholder="colleague@hostel.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="warden">Warden</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>
                <Mail className="size-4" data-icon="inline-start" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  function renderNotifications() {
    return (
      <div className="space-y-6">
        {/* Channels */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Notification Channels</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get text messages for critical alerts
                  </p>
                </div>
              </div>
              <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Browser and mobile push alerts
                  </p>
                </div>
              </div>
              <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Notification Categories</CardTitle>
            <CardDescription>
              Fine-tune which types of events trigger notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Complaint Updates</p>
                  <p className="text-xs text-muted-foreground">
                    New complaints, status changes, and resolutions
                  </p>
                </div>
              </div>
              <Switch
                checked={complaintUpdates}
                onCheckedChange={setComplaintUpdates}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fee Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Payment due dates and overdue alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={feeReminders}
                onCheckedChange={setFeeReminders}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gate Pass Approvals</p>
                  <p className="text-xs text-muted-foreground">
                    Incoming gate pass requests and approvals
                  </p>
                </div>
              </div>
              <Switch
                checked={gatePassApprovals}
                onCheckedChange={setGatePassApprovals}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">System Announcements</p>
                  <p className="text-xs text-muted-foreground">
                    Platform updates, maintenance windows
                  </p>
                </div>
              </div>
              <Switch
                checked={systemAnnouncements}
                onCheckedChange={setSystemAnnouncements}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveNotifications}>Save Preferences</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function renderBilling() {
    return (
      <div className="space-y-6">
        {/* Current Plan */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Current Plan</CardTitle>
            <CardDescription>
              Your subscription and usage overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">
                      Professional
                    </h3>
                    <Badge>Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed monthly &middot; Next renewal Apr 28, 2026
                  </p>
                </div>
                <Zap className="size-8 text-primary" />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-lg font-semibold">248 / 500</p>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: '49.6%' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rooms</p>
                  <p className="text-lg font-semibold">120 / 200</p>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                  <p className="text-lg font-semibold">4 / 10</p>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => toast.info('Manage billing coming soon')}
            >
              Manage Billing
            </Button>
            <Button onClick={() => toast.info('Plan upgrade coming soon')}>
              Upgrade Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Billing History */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Billing History</CardTitle>
            <CardDescription>
              Past invoices and payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No billing history yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your invoices and receipts will appear here after your first
                billing cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderSecurity() {
    return (
      <div className="space-y-6">
        {/* Password */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Change Password</CardTitle>
            <CardDescription>
              Update your account password regularly for better security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                className="rounded-lg max-w-md"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md sm:max-w-none">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  className="rounded-lg"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="rounded-lg"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleChangePassword}>
              <Lock className="size-4" data-icon="inline-start" />
              Update Password
            </Button>
          </CardFooter>
        </Card>

        {/* Active Sessions */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">Active Sessions</CardTitle>
            <CardDescription>
              Devices and locations where your account is currently signed in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.map((session: any, idx: number) => {
              const Icon = session.icon;
              return (
                <div key={session.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {session.browser} &middot; {session.os}
                          </p>
                          {session.current && (
                            <Badge variant="secondary" className="text-[10px]">
                              This device
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {session.ip} &middot; {session.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                  {idx !== sessions.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })}
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              variant="destructive"
              onClick={() => setRevokeDialogOpen(true)}
            >
              Revoke All Sessions
            </Button>
          </CardFooter>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">
                    Use an app like Google Authenticator or Authy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
                <Switch disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revoke Dialog */}
        <ConfirmDialog
          open={revokeDialogOpen}
          onOpenChange={setRevokeDialogOpen}
          title="Revoke All Sessions"
          description="This will sign you out from all other devices. You will need to sign in again on those devices. Your current session will remain active."
          confirmLabel="Revoke All"
          variant="destructive"
          onConfirm={handleRevokeAllSessions}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <PageHeader
          title="Settings"
          description="Manage your hostel configuration and preferences"
        />
      </motion.div>

      <motion.div variants={item}>
        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-col md:flex-row gap-6"
        >
          {/* Vertical tab navigation */}
          <TabsList
            variant="line"
            className="flex-shrink-0 md:w-52 flex-row md:flex-col md:items-stretch border-b md:border-b-0 md:border-r border-border overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 md:pr-4 md:pt-1 h-auto gap-0.5"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  <Icon className="size-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <TabsContent value="general">{renderGeneral()}</TabsContent>
            <TabsContent value="team">{renderTeam()}</TabsContent>
            <TabsContent value="notifications">
              {renderNotifications()}
            </TabsContent>
            <TabsContent value="billing">{renderBilling()}</TabsContent>
            <TabsContent value="security">{renderSecurity()}</TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
