'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] });

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { password: string }) => {
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      toast.success('Password reset successful');
      router.push('/login');
    } catch {
      toast.error('Reset failed. Token may be expired.');
    }
  };

  return (
    <Card className="w-full max-w-md rounded-[20px] shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-display text-xl font-bold">Set new password</h2>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" className="rounded-lg" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input type="password" className="rounded-lg" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Suspense fallback={<div className="animate-pulse text-muted-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
