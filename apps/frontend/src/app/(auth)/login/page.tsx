'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, LogIn, Zap, Shield, BedDouble, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
  { icon: BedDouble, label: 'Room Management', desc: 'Smart allocation & occupancy tracking' },
  { icon: Shield, label: 'Secure & Reliable', desc: 'Role-based access for every user' },
  { icon: BarChart3, label: 'Real-time Analytics', desc: 'Dashboards that drive decisions' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      switch (user.role) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'WARDEN':
          router.push('/admin/dashboard');
          break;
        case 'STAFF':
          router.push('/staff/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-4xl font-bold leading-tight">
              Manage your hostel
              <br />
              <span className="text-sidebar-primary">smarter, not harder</span>
            </h1>
            <p className="text-sidebar-foreground/70 mt-4 text-base leading-relaxed max-w-sm">
              Complete digital solution for room allocation, fee management, complaints, and real-time analytics.
            </p>
          </motion.div>

          <div className="mt-12 space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="rounded-lg bg-sidebar-accent/50 p-2 shrink-0">
                  <f.icon className="h-4 w-4 text-sidebar-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-sidebar-foreground/50">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-sidebar-foreground/40">
          &copy; 2026 Campusphere. Built for modern institutions.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-background to-primary/[0.02]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Campusphere</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.edu"
                className="h-11 rounded-lg"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="h-11 rounded-lg pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 rounded-lg font-medium" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </span>
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-background p-2">
                <p className="font-medium">Admin</p>
                <p className="text-muted-foreground">admin@campusphere.edu</p>
                <p className="text-muted-foreground/70">admin123</p>
              </div>
              <div className="rounded-lg bg-background p-2">
                <p className="font-medium">Student</p>
                <p className="text-muted-foreground">cs2024001@student.edu</p>
                <p className="text-muted-foreground/70">student123</p>
              </div>
              <div className="rounded-lg bg-background p-2">
                <p className="font-medium">Warden</p>
                <p className="text-muted-foreground">warden@campusphere.edu</p>
                <p className="text-muted-foreground/70">warden123</p>
              </div>
              <div className="rounded-lg bg-background p-2">
                <p className="font-medium">Staff</p>
                <p className="text-muted-foreground">ramesh.yadav@campusphere.edu</p>
                <p className="text-muted-foreground/70">staff123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-primary font-medium hover:underline">Register here</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
