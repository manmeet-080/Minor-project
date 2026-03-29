'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Zap, GraduationCap, Building2, ShieldCheck, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  department: z.string().min(1, 'Department is required'),
  year: z.coerce.number().int().min(1).max(6),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Select gender' }),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(10, 'Enter a valid phone number'),
  permanentAddress: z.string().min(5, 'Address must be at least 5 characters'),
  hostelId: z.string().uuid('Select a hostel'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Hostel {
  id: string;
  name: string;
  code: string;
  gender: string;
}

const features = [
  { icon: GraduationCap, text: 'Easy hostel application' },
  { icon: Building2, text: 'Room allocation and management' },
  { icon: ShieldCheck, text: 'Gate pass and safety features' },
  { icon: UtensilsCrossed, text: 'Mess booking and menu' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { year: 1, gender: undefined, hostelId: '' },
  });

  const selectedGender = watch('gender');

  useEffect(() => {
    api.get('/hostels').then((res) => {
      setHostels(res.data.data || []);
    }).catch(() => {});
  }, []);

  const filteredHostels = hostels.filter((h) =>
    !selectedGender || h.gender === selectedGender || h.gender === 'OTHER'
  );

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      await api.post('/students/apply', payload);
      toast.success('Application submitted! You will be notified once approved.');
      router.push('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-sidebar text-sidebar-foreground flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sidebar-primary/20 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-xl">Campusphere</span>
              <span className="block text-xs text-sidebar-foreground/60">Smart Campus Management</span>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-display text-3xl font-bold leading-tight mb-4">
              Apply for Hostel<br />Accommodation
            </h1>
            <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-sm">
              Fill in your details to submit a hostel application. Your request will be reviewed and approved by the hostel administration.
            </p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-sidebar-primary" />
                </div>
                <span className="text-sm text-sidebar-foreground/80">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/40">&copy; 2026 Campusphere. Built for modern institutions.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-background to-primary/[0.02] overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[520px] py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Campusphere</span>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold">Student Registration</h2>
            <p className="text-muted-foreground mt-1 text-sm">Fill in your details to apply for hostel accommodation</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Account Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" className="rounded-lg" placeholder="Arun Kumar" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className="rounded-lg" placeholder="you@student.edu" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPw ? 'text' : 'password'} className="rounded-lg pr-10" placeholder="Min 6 characters" {...register('password')} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" className="rounded-lg" placeholder="Repeat password" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" className="rounded-lg" placeholder="9876543210" {...register('phone')} />
              </div>
            </div>

            <Separator />

            {/* Academic Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input id="rollNumber" className="rounded-lg" placeholder="CS2024001" {...register('rollNumber')} />
                  {errors.rollNumber && <p className="text-xs text-destructive">{errors.rollNumber.message}</p>}
                </div>
                <div className="col-span-3 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" className="rounded-lg" placeholder="Computer Science" {...register('department')} />
                  {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                </div>
                <div className="col-span-3 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="year">Year</Label>
                  <Select onValueChange={(v) => v && setValue('year', Number(v))} defaultValue="1">
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((y) => (
                        <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal + Hostel */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal & Hostel</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select onValueChange={(v) => { if (v) { setValue('gender', v as any); setValue('hostelId', ''); } }}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Hostel</Label>
                  <Select onValueChange={(v) => v && setValue('hostelId', v)} disabled={!selectedGender}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder={selectedGender ? 'Select hostel' : 'Select gender first'} /></SelectTrigger>
                    <SelectContent>
                      {filteredHostels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name} ({h.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hostelId && <p className="text-xs text-destructive">{errors.hostelId.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="parentName">Parent / Guardian Name</Label>
                  <Input id="parentName" className="rounded-lg" placeholder="Full name" {...register('parentName')} />
                  {errors.parentName && <p className="text-xs text-destructive">{errors.parentName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone">Parent Phone</Label>
                  <Input id="parentPhone" className="rounded-lg" placeholder="9876543210" {...register('parentPhone')} />
                  {errors.parentPhone && <p className="text-xs text-destructive">{errors.parentPhone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea id="permanentAddress" className="rounded-lg min-h-[80px]" placeholder="Full residential address" {...register('permanentAddress')} />
                {errors.permanentAddress && <p className="text-xs text-destructive">{errors.permanentAddress.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full rounded-lg h-11 font-medium" disabled={loading}>
              {loading ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-medium hover:underline">Login here</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
